import type {
  Chunk,
  ChunkId,
  DocumentId,
  ParseTier,
  TableEvidence,
  TenantId,
} from "@amkp/domain";

export interface CreateChunkInput {
  tenantId: TenantId;
  documentId: DocumentId;
  content: string;
  parseTier: ParseTier;
  parseConfidence: number;
  ordinal: number;
  table?: TableEvidence;
}

export interface ChunkRepository {
  replaceForDocument(
    tenantId: TenantId,
    documentId: DocumentId,
    chunks: CreateChunkInput[],
  ): Promise<Chunk[]>;
  listByDocumentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Chunk[]>;
}

export const CHUNK_REPOSITORY = Symbol("CHUNK_REPOSITORY");

export interface ParsedText {
  text: string;
  /** Confidence that this tier recovered usable text ∈ [0,1] */
  confidence: number;
  usedVlm: boolean;
  /** USD spend attributed to this extraction (0 for tiers 1–2). */
  spendUsd?: number;
}

export interface ParseLadderPort {
  /** Cheap text extraction (tier1). Must never call a VLM. */
  extractTier1(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText>;

  /** Layout-aware extraction (tier2). Must never call a VLM. */
  extractTier2(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText>;

  /**
   * Page-vision / VLM tier (tier3). May spend; only called when Tenant
   * pageVisionEnabled is true (T-2.4).
   */
  extractTier3(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText>;
}

export const PARSE_LADDER = Symbol("PARSE_LADDER");

/** Test double / accounting for VLM calls. */
export interface PageVisionSpendLedger {
  calls: number;
  spendUsd: number;
}

export const PAGE_VISION_LEDGER = Symbol("PAGE_VISION_LEDGER");

export type { ChunkId };
