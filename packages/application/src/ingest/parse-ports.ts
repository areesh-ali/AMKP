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
}

export const PARSE_LADDER = Symbol("PARSE_LADDER");

export type { ChunkId };
