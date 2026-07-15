import type { EvidenceEnvelope, EvidenceItem } from "@amkp/domain";

const FORBIDDEN_ANSWER_KEYS = [
  "answer",
  "finalAnswer",
  "final_answer",
  "completion",
  "message",
] as const;

/**
 * Runtime guard for EvidenceEnvelope (T-3.2 / AD-4).
 * Ensures citation is present and no chat/answer fields sneak in.
 */
export function assertEvidenceEnvelope(
  value: unknown,
): asserts value is EvidenceEnvelope {
  if (!value || typeof value !== "object") {
    throw new Error("EvidenceEnvelope must be an object");
  }
  const env = value as Record<string, unknown>;

  for (const key of FORBIDDEN_ANSWER_KEYS) {
    if (key in env) {
      throw new Error(
        `EvidenceEnvelope must not include chat answer field: ${key}`,
      );
    }
  }

  if (env.schemaVersion !== "1") {
    throw new Error("EvidenceEnvelope.schemaVersion must be \"1\"");
  }
  if (typeof env.requestId !== "string" || !env.requestId) {
    throw new Error("EvidenceEnvelope.requestId is required");
  }
  if (typeof env.tenantId !== "string" || !env.tenantId) {
    throw new Error("EvidenceEnvelope.tenantId is required");
  }
  if (!env.costEstimate || typeof env.costEstimate !== "object") {
    throw new Error("EvidenceEnvelope.costEstimate is required");
  }
  const cost = env.costEstimate as Record<string, unknown>;
  if (cost.currency !== "USD" || typeof cost.estimatedUsd !== "number") {
    throw new Error("CostEstimate requires currency=USD and estimatedUsd");
  }

  if (!env.outcome || typeof env.outcome !== "object") {
    throw new Error("EvidenceEnvelope.outcome is required");
  }
  const outcome = env.outcome as Record<string, unknown>;
  if (outcome.kind === "evidence") {
    if (!Array.isArray(outcome.items)) {
      throw new Error("evidence outcome requires items[]");
    }
    for (const item of outcome.items) {
      assertEvidenceItem(item);
    }
  } else if (outcome.kind === "insufficient_evidence") {
    if (typeof outcome.reason !== "string") {
      throw new Error("insufficient_evidence requires reason");
    }
    if (typeof outcome.threshold !== "number") {
      throw new Error("insufficient_evidence requires threshold");
    }
  } else {
    throw new Error(`Unknown outcome.kind: ${String(outcome.kind)}`);
  }
}

function assertEvidenceItem(value: unknown): asserts value is EvidenceItem {
  if (!value || typeof value !== "object") {
    throw new Error("EvidenceItem must be an object");
  }
  const item = value as Record<string, unknown>;
  for (const key of FORBIDDEN_ANSWER_KEYS) {
    if (key in item) {
      throw new Error(`EvidenceItem must not include chat answer field: ${key}`);
    }
  }
  if (typeof item.id !== "string" || !item.id) {
    throw new Error("EvidenceItem.id is required");
  }
  if (typeof item.score !== "number") {
    throw new Error("EvidenceItem.score is required");
  }
  if (!item.citation || typeof item.citation !== "object") {
    throw new Error("EvidenceItem.citation is required");
  }
  const citation = item.citation as Record<string, unknown>;
  if (typeof citation.documentId !== "string" || !citation.documentId) {
    throw new Error("Citation.documentId is required");
  }
}
