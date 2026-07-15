import { ulid } from "ulid";
import type {
  Chunk,
  DocumentId,
  ParseTier,
  TableEvidence,
  TenantId,
} from "@amkp/domain";
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
        documentVersionId: c.documentVersionId,
        content: c.content,
        parseTier: c.parseTier,
        parseConfidence: c.parseConfidence,
        ordinal: c.ordinal,
        tableJson: c.table
          ? (JSON.parse(JSON.stringify(c.table)) as object)
          : undefined,
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
  documentVersionId: string;
  content: string;
  parseTier: string;
  parseConfidence: number;
  ordinal: number;
  tableJson: unknown;
  createdAt: Date;
}): Chunk {
  const chunk: Chunk = {
    id: row.id,
    tenantId: row.tenantId,
    documentId: row.documentId,
    documentVersionId: row.documentVersionId,
    content: row.content,
    parseTier: row.parseTier as ParseTier,
    parseConfidence: row.parseConfidence,
    ordinal: row.ordinal,
    createdAt: toIso(row.createdAt),
  };
  const table = asTableEvidence(row.tableJson);
  if (table) chunk.table = table;
  return chunk;
}

function asTableEvidence(value: unknown): TableEvidence | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as { headers?: unknown; rows?: unknown };
  if (!Array.isArray(v.headers) || !Array.isArray(v.rows)) return undefined;
  if (!v.headers.every((h) => typeof h === "string")) return undefined;
  if (
    !v.rows.every(
      (r) => Array.isArray(r) && r.every((c) => typeof c === "string"),
    )
  ) {
    return undefined;
  }
  return {
    headers: v.headers as string[],
    rows: v.rows as string[][],
  };
}
