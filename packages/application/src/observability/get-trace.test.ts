import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "../retrieve/retrieve";
import { GetTraceUseCase } from "./get-trace";
import {
  TraceNotFoundError,
  TraceTenantMismatchError,
  type TraceRepository,
} from "./trace-ports";
import type { TraceRecord } from "@amkp/domain";
import { MissingTenantContextError } from "../tenancy/ports";

class MemTraces implements TraceRepository {
  readonly items = new Map<string, TraceRecord>();
  async save(t: TraceRecord) {
    this.items.set(t.requestId, t);
  }
  async findByRequestId(id: string) {
    return this.items.get(id) ?? null;
  }
}

class FakeIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[]) {}
  async upsert() {}
  async search(input: { namespace: string; query: string }) {
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .map((c) => ({ ...c, score: 0.9 }));
  }
}

describe("Trace get (T-6.1)", () => {
  it("retrieve persists Trace; get returns Tenant/router/evidence/cost", async () => {
    const ten = "ten_A";
    const traces = new MemTraces();
    const uc = new RetrieveUseCase(
      new FakeIndex([
        {
          id: "ev_1",
          tenantId: ten,
          namespace: tenantVectorNamespace(ten),
          documentId: "doc_1",
          content: "policy",
        },
      ]),
      undefined,
      undefined,
      traces,
    );
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "policy" },
      { requestId: "req_trace_1" },
    );

    const get = new GetTraceUseCase(traces);
    const trace = await get.execute(
      { tenantId: ten, accountId: "acc_1" },
      envelope.requestId,
    );
    expect(trace.tenantId).toBe(ten);
    expect(trace.routerDecision.mode).toBe("single_pass");
    expect(trace.evidenceIds).toEqual(["ev_1"]);
    expect(trace.costEstimate.currency).toBe("USD");
    expect(trace.createdAt).toBeTruthy();
    expect(trace.steps).toEqual([]);
  });

  it("cross-Tenant Trace access is denied", async () => {
    const traces = new MemTraces();
    await traces.save({
      requestId: "req_a",
      tenantId: "ten_A",
      createdAt: new Date().toISOString(),
      routerDecision: { mode: "single_pass", reasonCode: "default" },
      evidenceIds: ["ev_1"],
      outcomeKind: "evidence",
      costEstimate: { currency: "USD", estimatedUsd: 0.001 },
      steps: [],
    });
    const get = new GetTraceUseCase(traces);
    await expect(
      get.execute({ tenantId: "ten_B", accountId: "acc_1" }, "req_a"),
    ).rejects.toBeInstanceOf(TraceTenantMismatchError);
    await expect(
      get.execute({ tenantId: "ten_A", accountId: "acc_1" }, "missing"),
    ).rejects.toBeInstanceOf(TraceNotFoundError);
    await expect(get.execute(null, "req_a")).rejects.toBeInstanceOf(
      MissingTenantContextError,
    );
  });
});
