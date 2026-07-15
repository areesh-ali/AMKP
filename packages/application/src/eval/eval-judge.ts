/**
 * Optional LLM (or remote) judge for golden-set eval (FR-21).
 * When unset, RunGoldenEvalUseCase uses lexical scoring only.
 */
export interface EvalJudgePort {
  judge(input: {
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
  }>;
}

export const EVAL_JUDGE = Symbol("EVAL_JUDGE");
