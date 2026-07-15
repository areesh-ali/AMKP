import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFER_CORRECTNESS_THRESHOLD,
  tenantVectorNamespace,
  type Tenant,
} from "@amkp/domain";
import {
  MissingTenantContextError,
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "./retrieve";
import { ValidationError, type TenantRepository } from "../tenancy/ports";

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
      .map((c) => ({ ...c, score: c.score ?? 1 }));
  }
}

function fakeTenants(
  threshold = DEFAULT_PREFER_CORRECTNESS_THRESHOLD,
): TenantRepository {
  return {
    async create() {
      throw new Error("unused");
    },
    async listByAccountId() {
      return [];
    },
    async findById(id) {
      const t: Tenant = {
        id,
        accountId: "acc_1",
        name: "t",
        agenticEnabled: false,
        pageVisionEnabled: false,
        preferCorrectnessThreshold: threshold,
        vectorNamespace: tenantVectorNamespace(id),
        createdAt: new Date().toISOString(),
      };
      return t;
    },
    async updateSettings() {
      throw new Error("unused");
    },
  };
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
      expect(envelope.outcome.items[0]?.id).toBe("ev_a");
      expect(envelope.outcome.items[0]?.citation.documentId).toBe("doc_a");
      expect(envelope.outcome.items[0]?.score).toBeGreaterThan(0);
      expect(
        envelope.outcome.items.every((i) => !i.content?.includes("for B")),
      ).toBe(true);
    }
  });

  it("returns empty evidence list when no matches (not fabricated)", async () => {
    const uc = new RetrieveUseCase(new FakeIndex([]));
    const envelope = await uc.execute(
      { tenantId: "ten_A", accountId: "acc_1" },
      { query: "nothing-here" },
      { requestId: "req_empty" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      expect(envelope.outcome.items).toEqual([]);
    }
  });

  it("preferCorrectness empty yields insufficient_evidence", async () => {
    const uc = new RetrieveUseCase(new FakeIndex([]), fakeTenants(0.5));
    const envelope = await uc.execute(
      { tenantId: "ten_A", accountId: "acc_1" },
      { query: "nothing-here", preferCorrectness: true },
      { requestId: "req_pc" },
    );
    expect(envelope.outcome.kind).toBe("insufficient_evidence");
    if (envelope.outcome.kind === "insufficient_evidence") {
      expect(envelope.outcome.threshold).toBe(0.5);
      expect(envelope.outcome.reason).toBe("no_matches");
    }
  });

  it("preferCorrectness below Tenant threshold yields insufficient_evidence", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new FakeIndex([
      {
        id: "weak",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha weak",
        score: 0.2,
      },
    ]);
    const uc = new RetrieveUseCase(index, fakeTenants(0.5));
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha", preferCorrectness: true },
      { requestId: "req_low" },
    );
    expect(envelope.outcome.kind).toBe("insufficient_evidence");
    if (envelope.outcome.kind === "insufficient_evidence") {
      expect(envelope.outcome.threshold).toBe(0.5);
      expect(envelope.outcome.reason).toBe("below_threshold");
    }
  });

  it("preferCorrectness above Tenant threshold returns evidence", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new FakeIndex([
      {
        id: "strong",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha strong",
        score: 0.8,
      },
    ]);
    const uc = new RetrieveUseCase(index, fakeTenants(0.5));
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha", preferCorrectness: true },
      { requestId: "req_ok" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      expect(envelope.outcome.items[0]?.id).toBe("strong");
    }
  });

  it("uses per-Tenant threshold from settings", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new FakeIndex([
      {
        id: "mid",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha mid",
        score: 0.4,
      },
    ]);
    const uc = new RetrieveUseCase(index, fakeTenants(0.3));
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha", preferCorrectness: true },
      { requestId: "req_cfg" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
  });

  it("reranks by score descending", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const index = new FakeIndex([
      {
        id: "low",
        tenantId: ten,
        namespace: ns,
        documentId: "d1",
        content: "alpha",
        score: 0.2,
      },
      {
        id: "high",
        tenantId: ten,
        namespace: ns,
        documentId: "d2",
        content: "alpha beta",
        score: 0.9,
      },
    ]);

    const uc = new RetrieveUseCase(index);
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "alpha" },
      { requestId: "req_rank" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      expect(envelope.outcome.items[0]?.id).toBe("high");
      expect(envelope.outcome.items[1]?.id).toBe("low");
    }
  });
});
