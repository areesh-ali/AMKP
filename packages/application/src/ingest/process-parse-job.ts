import { randomUUID } from "node:crypto";
import type {
  Chunk,
  DocumentId,
  ParseTier,
  TableEvidence,
  TenantId,
} from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import type { VectorIndexPort } from "../retrieve/retrieve";
import { DocumentNotFoundError, type DocumentRepository } from "./ports";
import type { ChunkRepository, ParseLadderPort } from "./parse-ports";
import {
  clampParseConfidence,
  segmentTextWithTables,
} from "./table-evidence";

const TIER1_MIN_CHARS = 20;
const CHUNK_SIZE = 800;

export interface ProcessParseJobResult {
  documentId: DocumentId;
  parseTier: ParseTier;
  chunkCount: number;
  tableChunkCount: number;
  usedVlm: false;
}

/**
 * Worker-side Parse Ladder (tiers 1–2 only). Never invokes VLM (T-2.4).
 * Emits TableEvidence chunks when tables are recoverable (FR-6 / T-2.3).
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

    const confidence = clampParseConfidence(chosen.confidence);
    const segments = segmentTextWithTables(chosen.text);
    const inputs: Array<{
      tenantId: TenantId;
      documentId: DocumentId;
      content: string;
      parseTier: ParseTier;
      parseConfidence: number;
      ordinal: number;
      table?: TableEvidence;
    }> = [];

    let ordinal = 0;
    for (const seg of segments) {
      if (seg.kind === "table" && seg.table) {
        inputs.push({
          tenantId: input.tenantId,
          documentId: input.documentId,
          content: seg.text,
          parseTier,
          parseConfidence: confidence,
          ordinal: ordinal++,
          table: seg.table,
        });
        continue;
      }
      for (const piece of splitIntoChunks(seg.text, CHUNK_SIZE)) {
        inputs.push({
          tenantId: input.tenantId,
          documentId: input.documentId,
          content: piece,
          parseTier,
          parseConfidence: confidence,
          ordinal: ordinal++,
        });
      }
    }

    const created = await this.chunks.replaceForDocument(
      input.tenantId,
      input.documentId,
      inputs,
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
        parseConfidence: chunk.parseConfidence,
        parseTier: chunk.parseTier,
        table: chunk.table,
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
      tableChunkCount: created.filter((c) => c.table).length,
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
  const normalized = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  const out: string[] = [];
  for (let i = 0; i < normalized.length; i += size) {
    out.push(normalized.slice(i, i + size));
  }
  return out;
}

export function newChunkId(): string {
  return `chk_${randomUUID().replace(/-/g, "")}`;
}
