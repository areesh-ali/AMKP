import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  MissingTenantContextError,
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "./retrieve";
import { ValidationError } from "../tenancy/ports";

class FakeIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[] = []) {}
  async upsert(chunk: IndexedChunk) {
    this.chunks.push(chunk);
  }
  async search(input: { namespace: string; query: string; limit?: number }) {
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .slice(0, input.limit ?? 10)
      .map((c) => ({ ...c, score: 1 }));
  }
}

describe("RetrieveUseCase fail-closed isolation", () => {
  it("refuses retrieve without TenantContext", async () => {
    const uc = new RetrieveUseCase(new FakeIndex());
    await expect(
      uc.execute(null, { query: "secret" }, { requestId: "req_1" }),
    ).rejects.toBeInstanceOf(MissingTenantContextError);
  });

  it("rejects empty query", async () => {
    const uc = new RetrieveUseCase(new FakeIndex());
    await expect(
      uc.execute(
        { tenantId: "ten_A", accountId: "acc_1" },
        { query: "   " },
        { requestId: "req_q" },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("never returns cross-Tenant content", async () => {
    const tenA = "ten_A";
    const tenB = "ten_B";
    const nsA = tenantVectorNamespace(tenA);
    const nsB = tenantVectorNamespace(tenB);
    const index = new FakeIndex([
      {
        id: "ev_a",
        tenantId: tenA,
        namespace: nsA,
        documentId: "doc_a",
        content: "alpha secret for A",
      },
      {
        id: "ev_b",
        tenantId: tenB,
        namespace: nsB,
        documentId: "doc_b",
        content: "alpha secret for B",
      },
    ]);

    const uc = new RetrieveUseCase(index);
    const envelope = await uc.execute(
      { tenantId: tenA, accountId: "acc_1" },
      { query: "alpha secret" },
      { requestId: "req_2" },
    );

    expect(envelope.tenantId).toBe(tenA);
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      expect(envelope.outcome.items).toHaveLength(1);
      expect(envelope.outcome.items[0]?.content).toContain("for A");
      expect(
        envelope.outcome.items.every((i) => !i.content?.includes("for B")),
      ).toBe(true);
    }
  });
});
