import { randomUUID } from "node:crypto";
import type { Chunk, DocumentId, ParseTier, TenantId } from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import type { VectorIndexPort } from "../retrieve/retrieve";
import { DocumentNotFoundError, type DocumentRepository } from "./ports";
import type { ChunkRepository, ParseLadderPort } from "./parse-ports";

const TIER1_MIN_CHARS = 20;
const CHUNK_SIZE = 800;

export interface ProcessParseJobResult {
  documentId: DocumentId;
  parseTier: ParseTier;
  chunkCount: number;
  usedVlm: false;
}

/**
 * Worker-side Parse Ladder (tiers 1–2 only). Never invokes VLM (T-2.4).
 */
export class ProcessParseJobUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly chunks: ChunkRepository,
    private readonly ladder: ParseLadderPort,
    private readonly index: VectorIndexPort,
  ) {}

  async execute(input: {
    tenantId: TenantId;
    documentId: DocumentId;
  }): Promise<ProcessParseJobResult> {
    const doc = await this.documents.findByIdForTenant(
      input.tenantId,
      input.documentId,
    );
    if (!doc) {
      throw new DocumentNotFoundError(input.documentId);
    }

    const content = await this.documents.getContentForTenant(
      input.tenantId,
      input.documentId,
    );
    if (!content) {
      throw new DocumentNotFoundError(input.documentId);
    }

    const tier1 = await this.ladder.extractTier1({
      filename: doc.filename,
      contentType: doc.contentType,
      content,
    });
    if (tier1.usedVlm) {
      throw new Error("Parse ladder invariant violated: tier1 used VLM");
    }

    let parseTier: ParseTier = "tier1_text";
    let chosen = tier1;

    if (tier1.text.trim().length < TIER1_MIN_CHARS) {
      const tier2 = await this.ladder.extractTier2({
        filename: doc.filename,
        contentType: doc.contentType,
        content,
      });
      if (tier2.usedVlm) {
        throw new Error("Parse ladder invariant violated: tier2 used VLM");
      }
      if (tier2.text.trim().length > tier1.text.trim().length) {
        parseTier = "tier2_layout";
        chosen = tier2;
      }
    }

    const pieces = splitIntoChunks(chosen.text, CHUNK_SIZE);
    const created = await this.chunks.replaceForDocument(
      input.tenantId,
      input.documentId,
      pieces.map((text, ordinal) => ({
        tenantId: input.tenantId,
        documentId: input.documentId,
        content: text,
        parseTier,
        parseConfidence: chosen.confidence,
        ordinal,
      })),
    );

    const namespace = tenantVectorNamespace(input.tenantId);
    for (const chunk of created) {
      await this.index.upsert({
        id: chunk.id,
        tenantId: input.tenantId,
        namespace,
        documentId: input.documentId,
        content: chunk.content,
        score: chunk.parseConfidence,
      });
    }

    await this.documents.updateStatus(
      input.tenantId,
      input.documentId,
      "parsed",
    );

    return {
      documentId: input.documentId,
      parseTier,
      chunkCount: created.length,
      usedVlm: false,
    };
  }
}

export class ListChunksUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly chunks: ChunkRepository,
  ) {}

  async execute(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Chunk[]> {
    const doc = await this.documents.findByIdForTenant(tenantId, documentId);
    if (!doc) {
      throw new DocumentNotFoundError(documentId);
    }
    return this.chunks.listByDocumentForTenant(tenantId, documentId);
  }
}

function splitIntoChunks(text: string, size: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const out: string[] = [];
  for (let i = 0; i < normalized.length; i += size) {
    out.push(normalized.slice(i, i + size));
  }
  return out;
}

/** Stable id helper for in-memory fakes (production uses ulid in adapter). */
export function newChunkId(): string {
  return `chk_${randomUUID().replace(/-/g, "")}`;
}
