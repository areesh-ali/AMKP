import type { EvalJudgePort } from "@amkp/application";

/**
 * HTTP eval judge adapter.
 * POSTs question + evidence context to AMKP_EVAL_JUDGE_URL and expects
 * `{ passed: boolean, score?: number, notes?: string, modelId?: string }`.
 */
export class HttpEvalJudge implements EvalJudgePort {
  constructor(
    private readonly endpoint: string,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly defaultModelId = "http-eval-judge",
  ) {}

  async judge(input: {
    question: string;
    evidenceContent: string;
    citationDocumentIds: string[];
    expectedDocumentIds?: string[];
    expectedKeywords?: string[];
    modelId?: string;
  }): Promise<{
    passed: boolean;
    score: number;
    notes: string;
    modelId: string;
  }> {
    const res = await this.fetchFn(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: input.question,
        evidenceContent: input.evidenceContent,
        citationDocumentIds: input.citationDocumentIds,
        expectedDocumentIds: input.expectedDocumentIds ?? [],
        expectedKeywords: input.expectedKeywords ?? [],
        modelId: input.modelId ?? this.defaultModelId,
      }),
    });
    if (!res.ok) {
      throw new Error(
        `Eval judge HTTP ${res.status}: ${await res.text().catch(() => "")}`,
      );
    }
    const body = (await res.json()) as {
      passed?: boolean;
      score?: number;
      notes?: string;
      modelId?: string;
    };
    if (typeof body.passed !== "boolean") {
      throw new Error("Eval judge response missing boolean passed");
    }
    return {
      passed: body.passed,
      score:
        typeof body.score === "number" && Number.isFinite(body.score)
          ? body.score
          : body.passed
            ? 1
            : 0,
      notes:
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes
          : body.passed
            ? "ok"
            : "judge failed",
      modelId:
        (typeof body.modelId === "string" && body.modelId.trim()) ||
        input.modelId ||
        this.defaultModelId,
    };
  }
}

export function createEvalJudgeFromEnv(
  fetchFn: typeof fetch = fetch,
): EvalJudgePort | undefined {
  const url = process.env.AMKP_EVAL_JUDGE_URL?.trim();
  if (!url) return undefined;
  const model =
    process.env.AMKP_EVAL_JUDGE_MODEL?.trim() || "http-eval-judge";
  return new HttpEvalJudge(url, fetchFn, model);
}
