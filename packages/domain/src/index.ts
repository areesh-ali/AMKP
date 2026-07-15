/** Domain types — EvidenceEnvelope is the public Retrieve contract (AD-4). */

export type AccountId = string;
export type TenantId = string;
export type DocumentId = string;
export type JobId = string;
export type EvidenceId = string;
export type RequestId = string;
export type ApiKeyId = string;

export type DocumentStatus =
  | "pending"
  | "accepted"
  | "parse_queued"
  | "parsed"
  | "failed";

/** Parse Ladder tiers — VLM/page-vision is opt-in later (T-2.4). */
export type ParseTier = "tier1_text" | "tier2_layout";

export type ChunkId = string;

export interface Document {
  id: DocumentId;
  tenantId: TenantId;
  filename: string;
  contentType: string;
  byteSize: number;
  status: DocumentStatus;
  createdAt: string; // UTC ISO-8601
}

export interface Chunk {
  id: ChunkId;
  tenantId: TenantId;
  documentId: DocumentId;
  content: string;
  parseTier: ParseTier;
  parseConfidence: number;
  ordinal: number;
  createdAt: string;
}

export interface Account {
  id: AccountId;
  name: string;
  createdAt: string; // UTC ISO-8601
}

export interface Tenant {
  id: TenantId;
  accountId: AccountId;
  name: string;
  /** AD-8: new Tenants default single-pass only */
  agenticEnabled: boolean;
  /** AD-3: dedicated vector namespace/collection for this Tenant */
  vectorNamespace: string;
  createdAt: string; // UTC ISO-8601
}

/** Canonical namespace for a Tenant (fail-closed data plane). */
export function tenantVectorNamespace(tenantId: TenantId): string {
  return `ns_${tenantId}`;
}

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
