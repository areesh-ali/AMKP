import { describe, expect, it, vi } from "vitest";
import {
  HttpEvalJudge,
  createEvalJudgeFromEnv,
} from "./http-eval-judge";

describe("HttpEvalJudge", () => {
  it("posts context and maps response", async () => {
    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.question).toBe("refund?");
      expect(body.evidenceContent).toContain("30 days");
      return new Response(
        JSON.stringify({
          passed: true,
          score: 0.95,
          notes: "good",
          modelId: "judge-v1",
        }),
        { status: 200 },
      );
    });
    const judge = new HttpEvalJudge("http://judge.test/v1", fetchFn as never);
    const out = await judge.judge({
      question: "refund?",
      evidenceContent: "refund within 30 days",
      citationDocumentIds: ["doc_1"],
      expectedKeywords: ["30 days"],
    });
    expect(out).toEqual({
      passed: true,
      score: 0.95,
      notes: "good",
      modelId: "judge-v1",
    });
  });
});

describe("createEvalJudgeFromEnv", () => {
  it("returns undefined without URL", () => {
    const prev = process.env.AMKP_EVAL_JUDGE_URL;
    delete process.env.AMKP_EVAL_JUDGE_URL;
    expect(createEvalJudgeFromEnv()).toBeUndefined();
    if (prev !== undefined) process.env.AMKP_EVAL_JUDGE_URL = prev;
  });
});
