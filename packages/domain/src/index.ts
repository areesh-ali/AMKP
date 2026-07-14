/** Domain types — EvidenceEnvelope is the public Retrieve contract (AD-4). */

export type TenantId = string;
export type DocumentId = string;
export type EvidenceId = string;
export type RequestId = string;

export interface Citation {
  documentId: DocumentId;
  location?: string;
  page?: number;
}

export interface CostEstimate {
  currency: "USD";
  estimatedUsd: number;
  actualUsd?: number;
}

export interface EvidenceItem {
  id: EvidenceId;
  score: number;
  citation: Citation;
  content?: string;
  table?: TableEvidence;
  parseConfidence?: number;
  parseTier?: string;
  documentVersionId?: string;
}

export interface TableEvidence {
  headers: string[];
  rows: string[][];
}

export type PreferCorrectnessOutcome =
  | { kind: "evidence"; items: EvidenceItem[] }
  | { kind: "insufficient_evidence"; reason: string; threshold: number };

export interface EvidenceEnvelope {
  schemaVersion: "1";
  requestId: RequestId;
  tenantId: TenantId;
  outcome: PreferCorrectnessOutcome;
  costEstimate: CostEstimate;
  routerDecision?: {
    mode: "single_pass" | "agentic";
    reasonCode: string;
  };
}
