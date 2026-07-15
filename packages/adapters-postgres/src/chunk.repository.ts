import { ulid } from "ulid";
import type { Chunk, DocumentId, ParseTier, TenantId } from "@amkp/domain";
import type {
  ChunkRepository,
  CreateChunkInput,
} from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { toIso } from "./crypto";

export class PrismaChunkRepository implements ChunkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceForDocument(
    tenantId: TenantId,
    documentId: DocumentId,
    chunks: CreateChunkInput[],
  ): Promise<Chunk[]> {
    await this.prisma.chunk.deleteMany({ where: { tenantId, documentId } });
    if (chunks.length === 0) return [];

    await this.prisma.chunk.createMany({
      data: chunks.map((c) => ({
        id: `chk_${ulid()}`,
        tenantId: c.tenantId,
        documentId: c.documentId,
        content: c.content,
        parseTier: c.parseTier,
        parseConfidence: c.parseConfidence,
        ordinal: c.ordinal,
      })),
    });

    return this.listByDocumentForTenant(tenantId, documentId);
  }

  async listByDocumentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Chunk[]> {
    const rows = await this.prisma.chunk.findMany({
      where: { tenantId, documentId },
      orderBy: { ordinal: "asc" },
    });
    return rows.map(mapChunk);
  }
}

function mapChunk(row: {
  id: string;
  tenantId: string;
  documentId: string;
  content: string;
  parseTier: string;
  parseConfidence: number;
  ordinal: number;
  createdAt: Date;
}): Chunk {
  return {
    id: row.id,
    tenantId: row.tenantId,
    documentId: row.documentId,
    content: row.content,
    parseTier: row.parseTier as ParseTier,
    parseConfidence: row.parseConfidence,
    ordinal: row.ordinal,
    createdAt: toIso(row.createdAt),
  };
}
