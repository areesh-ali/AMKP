import { describe, expect, it } from "vitest";
import { assertEvidenceEnvelope } from "./evidence-envelope";
import { RetrieveUseCase, type IndexedChunk, type VectorIndexPort } from "./retrieve";
import { tenantVectorNamespace } from "@amkp/domain";

class FakeIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[] = []) {}
  async upsert(chunk: IndexedChunk) {
    this.chunks.push(chunk);
  }
  async search(input: { namespace: string; query: string }) {
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .map((c) => ({ ...c, score: c.score ?? 1 }));
  }
}

describe("EvidenceEnvelope schema (T-3.2)", () => {
  it("requires citation.documentId and forbids answer fields", () => {
    expect(() =>
      assertEvidenceEnvelope({
        schemaVersion: "1",
        requestId: "req_1",
        tenantId: "ten_1",
        outcome: {
          kind: "evidence",
          items: [
            {
              id: "ev_1",
              score: 0.9,
              citation: { documentId: "doc_1" },
              content: "hello",
            },
          ],
        },
        costEstimate: { currency: "USD", estimatedUsd: 0 },
      }),
    ).not.toThrow();

    expect(() =>
      assertEvidenceEnvelope({
        schemaVersion: "1",
        requestId: "req_1",
        tenantId: "ten_1",
        outcome: {
          kind: "evidence",
          items: [{ id: "ev_1", score: 0.9, content: "no citation" }],
        },
        costEstimate: { currency: "USD", estimatedUsd: 0 },
      }),
    ).toThrow(/citation/i);

    expect(() =>
      assertEvidenceEnvelope({
        schemaVersion: "1",
        requestId: "req_1",
        tenantId: "ten_1",
        outcome: { kind: "evidence", items: [] },
        costEstimate: { currency: "USD", estimatedUsd: 0 },
        answer: "fabricated",
      }),
    ).toThrow(/answer/i);
  });

  it("RetrieveUseCase envelopes pass schema guard", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const uc = new RetrieveUseCase(
      new FakeIndex([
        {
          id: "ev_1",
          tenantId: ten,
          namespace: ns,
          documentId: "doc_1",
          content: "policy text",
          score: 0.8,
        },
      ]),
    );
    const envelope = await uc.execute(
      { tenantId: ten, accountId: "acc_1" },
      { query: "policy" },
      { requestId: "req_ok" },
    );
    expect(() => assertEvidenceEnvelope(envelope)).not.toThrow();
    expect("answer" in envelope).toBe(false);
  });
});
