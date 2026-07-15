import type {
  CostEstimate,
  EvidenceId,
  RequestId,
  TenantId,
} from "./index";

/** Persisted retrieve Trace for debugging (FR-19 / T-6.1). */
export interface TraceRecord {
  requestId: RequestId;
  tenantId: TenantId;
  createdAt: string; // UTC ISO-8601
  routerDecision: {
    mode: "single_pass" | "agentic";
    reasonCode: string;
  };
  evidenceIds: EvidenceId[];
  outcomeKind: "evidence" | "insufficient_evidence";
  costEstimate: CostEstimate;
}
