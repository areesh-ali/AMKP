import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "../retrieve/retrieve";
import type { TenantRepository } from "../tenancy/ports";
import type { Tenant } from "@amkp/domain";

class CountingIndex implements VectorIndexPort {
  searches = 0;
  constructor(private readonly chunks: IndexedChunk[]) {}
  async upsert() {}
  async search(input: { namespace: string; query: string; limit?: number }) {
    this.searches += 1;
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q.split(/\s+/)[0]!))
      .map((c) => ({ ...c, score: 0.9 }));
  }
}

function tenants(patch: Partial<Tenant> = {}): TenantRepository {
  return {
    async create() {
      throw new Error("unused");
    },
    async listByAccountId() {
      return [];
    },
    async findById(id) {
      return {
        id,
        accountId: "acc_1",
        name: "t",
        agenticEnabled: true,
        pageVisionEnabled: false,
        preferCorrectnessThreshold: 0.5,
        agenticReadinessPassed: true,
        agenticMaxHops: 3,
        agenticMaxCostUsd: 0.01,
        vectorNamespace: tenantVectorNamespace(id),
        createdAt: new Date().toISOString(),
        ...patch,
      };
    },
    async updateSettings() {
      throw new Error("unused");
    },
  };
}

describe("Agentic hop/cost circuit breakers (T-4.3)", () => {
  it("stops at max hops with hop_budget", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new CountingIndex([
      {
        id: "ev_1",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha refund policy details about returns",
      },
    ]);
    const traces = {
      items: [] as import("@amkp/domain").TraceRecord[],
      async save(t: import("@amkp/domain").TraceRecord) {
        this.items.push(t);
      },
      async findByRequestId(id: string) {
        return this.items.find((x) => x.requestId === id) ?? null;
      },
    };
    const uc = new RetrieveUseCase(
      index,
      tenants({ agenticMaxHops: 3, agenticMaxCostUsd: 1 }),
      undefined,
      traces,
    );
    const env = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha", mode: "agentic" },
      { requestId: "req_hops" },
    );
    expect(env.routerDecision?.mode).toBe("agentic");
    expect(env.routerDecision?.hops).toBe(3);
    expect(env.routerDecision?.terminationReason).toBe("hop_budget");
    expect(index.searches).toBe(3);
    expect(env.outcome.kind).toBe("evidence");

    const saved = traces.items[0]!;
    expect(saved.steps).toHaveLength(3);
    expect(saved.steps[0]?.tool).toBe("retrieve");
    expect(saved.steps[0]?.query).toContain("alpha");
    expect(saved.steps[0]?.evidenceIds).toContain("ev_1");
    expect(saved.steps[0]?.costEstimate.currency).toBe("USD");
    expect(saved.steps[1]?.hop).toBe(2);
    expect(saved.steps[2]?.hop).toBe(3);
  });

  it("stops on cost_budget with partial Evidence", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new CountingIndex([
      {
        id: "ev_1",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha refund policy",
      },
    ]);
    const uc = new RetrieveUseCase(
      index,
      tenants({
        agenticMaxHops: 10,
        // First hop always runs; second hop trips cost budget.
        agenticMaxCostUsd: 0.0000015,
      }),
    );
    const env = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha", mode: "agentic" },
      { requestId: "req_cost" },
    );
    expect(env.routerDecision?.terminationReason).toBe("cost_budget");
    expect(env.routerDecision?.hops).toBeGreaterThanOrEqual(1);
    expect(env.outcome.kind).toBe("evidence");
    if (env.outcome.kind === "evidence") {
      expect(env.outcome.items.length).toBeGreaterThanOrEqual(1);
    }
  });
});
