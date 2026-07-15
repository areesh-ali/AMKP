import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "../retrieve/retrieve";
import { RunGoldenEvalUseCase } from "./golden-eval";

class FakeIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[]) {}
  async upsert() {}
  async search(input: { namespace: string; query: string }) {
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q.split(/\s+/)[0]!))
      .map((c) => ({ ...c, score: 0.9 }));
  }
}

describe("RunGoldenEvalUseCase (T-7.1)", () => {
  it("returns per-question outcomes and records judge modelId for llm", async () => {
    const ten = "ten_A";
    const ns = tenantVectorNamespace(ten);
    const retrieve = new RetrieveUseCase(
      new FakeIndex([
        {
          id: "ev_1",
          tenantId: ten,
          namespace: ns,
          documentId: "doc_refund",
          content: "refund policy within 30 days",
        },
      ]),
    );
    const evalUc = new RunGoldenEvalUseCase(retrieve);
    const report = await evalUc.execute(
      { tenantId: ten, accountId: "acc_1" },
      {
        questions: [
          {
            id: "q1",
            question: "refund",
            expectedDocumentIds: ["doc_refund"],
            expectedKeywords: ["30 days"],
          },
          {
            id: "q2",
            question: "refund",
            expectedDocumentIds: ["doc_missing"],
          },
        ],
        judge: { kind: "llm", modelId: "judge-gpt-test" },
      },
      { requestId: "eval_1" },
    );

    expect(report.judge.modelId).toBe("judge-gpt-test");
    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(1);
    expect(report.outcomes[0]?.passed).toBe(true);
    expect(report.outcomes[1]?.passed).toBe(false);
    expect(report.outcomes[0]?.notes).toContain("llm judge not configured");
  });

  it("uses EvalJudgePort when configured for llm kind", async () => {
    const ten = "ten_B";
    const ns = tenantVectorNamespace(ten);
    const retrieve = new RetrieveUseCase(
      new FakeIndex([
        {
          id: "ev_1",
          tenantId: ten,
          namespace: ns,
          documentId: "doc_1",
          content: "anything",
        },
      ]),
    );
    const evalUc = new RunGoldenEvalUseCase(retrieve, {
      async judge() {
        return {
          passed: false,
          score: 0.1,
          notes: "remote fail",
          modelId: "remote-judge",
        };
      },
    });
    const report = await evalUc.execute(
      { tenantId: ten, accountId: "acc_1" },
      {
        questions: [{ id: "q1", question: "refund", expectedDocumentIds: ["doc_1"] }],
        judge: { kind: "llm", modelId: "client-model" },
      },
      { requestId: "eval_2" },
    );
    expect(report.judge.modelId).toBe("remote-judge");
    expect(report.outcomes[0]?.passed).toBe(false);
    expect(report.outcomes[0]?.notes).toBe("remote fail");
  });
});
