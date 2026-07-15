import type { TenantId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";
import type { RetrieveUseCase } from "../retrieve/retrieve";

export interface GoldenQuestion {
  id: string;
  question: string;
  /** Document IDs that should appear in citations for a pass. */
  expectedDocumentIds?: string[];
  /** Keywords that should appear in evidence content for a pass. */
  expectedKeywords?: string[];
}

export interface GoldenEvalQuestionOutcome {
  questionId: string;
  question: string;
  passed: boolean;
  evidenceIds: string[];
  citationDocumentIds: string[];
  score: number;
  notes: string;
}

export interface GoldenEvalReport {
  tenantId: TenantId;
  requestId: string;
  completedAt: string;
  judge: {
    kind: "lexical_stub" | "llm";
    /** Recorded when LLM-judge is used (FR-21). */
    modelId: string | null;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  outcomes: GoldenEvalQuestionOutcome[];
}

/**
 * Golden-set eval runner (FR-21 / T-7.1).
 * MVP judge is lexical overlap; LLM judge modelId is plumbed for later.
 */
export class RunGoldenEvalUseCase {
  constructor(private readonly retrieve: RetrieveUseCase) {}

  async execute(
    ctx: TenantContext | undefined | null,
    input: {
      questions: GoldenQuestion[];
      judge?: { kind: "lexical_stub" | "llm"; modelId?: string };
    },
    options: { requestId: string },
  ): Promise<GoldenEvalReport> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    if (!Array.isArray(input.questions) || input.questions.length === 0) {
      throw new ValidationError("questions must be a non-empty array");
    }

    const judgeKind = input.judge?.kind ?? "lexical_stub";
    const modelId =
      judgeKind === "llm" ? (input.judge?.modelId ?? "unspecified-llm-judge") : null;

    const outcomes: GoldenEvalQuestionOutcome[] = [];
    for (const q of input.questions) {
      if (!q.id?.trim() || !q.question?.trim()) {
        throw new ValidationError("each question requires id and question");
      }
      const envelope = await this.retrieve.execute(
        ctx,
        { query: q.question },
        { requestId: `${options.requestId}_${q.id}` },
      );

      const items =
        envelope.outcome.kind === "evidence" ? envelope.outcome.items : [];
      const evidenceIds = items.map((i) => i.id);
      const citationDocumentIds = items.map((i) => i.citation.documentId);
      const contentBlob = items.map((i) => i.content ?? "").join("\n").toLowerCase();

      let passed = true;
      const notes: string[] = [];

      if (q.expectedDocumentIds?.length) {
        const hit = q.expectedDocumentIds.some((d) =>
          citationDocumentIds.includes(d),
        );
        if (!hit) {
          passed = false;
          notes.push("expected document citation missing");
        }
      }
      if (q.expectedKeywords?.length) {
        const hit = q.expectedKeywords.every((k) =>
          contentBlob.includes(k.toLowerCase()),
        );
        if (!hit) {
          passed = false;
          notes.push("expected keywords missing from evidence");
        }
      }
      if (
        !q.expectedDocumentIds?.length &&
        !q.expectedKeywords?.length &&
        items.length === 0
      ) {
        passed = false;
        notes.push("no evidence returned");
      }

      const topScore = items[0]?.score ?? 0;
      outcomes.push({
        questionId: q.id,
        question: q.question,
        passed,
        evidenceIds,
        citationDocumentIds,
        score: topScore,
        notes: notes.join("; ") || "ok",
      });
    }

    const passed = outcomes.filter((o) => o.passed).length;
    return {
      tenantId: ctx.tenantId,
      requestId: options.requestId,
      completedAt: new Date().toISOString(),
      judge: { kind: judgeKind, modelId },
      summary: {
        total: outcomes.length,
        passed,
        failed: outcomes.length - passed,
      },
      outcomes,
    };
  }
}
