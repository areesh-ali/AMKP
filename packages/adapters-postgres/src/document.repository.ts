import { ulid } from "ulid";
import type {
  Document,
  DocumentId,
  DocumentStatus,
  TenantId,
} from "@amkp/domain";
import type {
  CreateDocumentInput,
  DocumentRepository,
  ListDocumentsOpts,
  ListDocumentsPage,
  ObjectStoragePort,
} from "@amkp/application";
import {
  DocumentNotFoundError,
  DocumentUniqueConflictError,
  clampDocumentListLimit,
  decodeDocumentCursor,
  documentObjectKey,
  encodeDocumentCursor,
} from "@amkp/application";
import type { Prisma, PrismaClient } from "./prisma";
import { toIso } from "./crypto";

/**
 * Document SoR. When ObjectStorage is provided, bytes are stored off-DB
 * and `storage_key` points at the blob; otherwise BYTEA `content` is used.
 */
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage?: ObjectStoragePort,
  ) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    const id = `doc_${ulid()}`;
    const storageKey = this.storage
      ? documentObjectKey(input.tenantId, id)
      : null;

    if (this.storage && storageKey) {
      await this.storage.put({
        key: storageKey,
        bytes: input.content,
        contentType: input.contentType,
      });
    }

    try {
      const row = await this.prisma.document.create({
        data: {
          id,
          tenantId: input.tenantId,
          filename: input.filename,
          contentType: input.contentType,
          byteSize: input.content.length,
          content: this.storage ? Buffer.alloc(0) : input.content,
          storageKey,
          sourceKey: input.sourceKey,
          version: input.version,
          contentHash: input.contentHash,
          status: "pending",
        },
      });
      return mapDocument(row);
    } catch (err) {
      // Compensate orphan blob if DB insert fails after a successful put.
      if (this.storage && storageKey) {
        try {
          await this.storage.delete(storageKey);
        } catch {
          // best-effort; surface the original DB error
        }
      }
      if (isPrismaUniqueViolation(err)) {
        throw new DocumentUniqueConflictError();
      }
      throw err;
    }
  }

  async findByIdForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Document | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!row) return null;
    return mapDocument(row);
  }

  async findLatestBySourceKey(
    tenantId: TenantId,
    sourceKey: string,
  ): Promise<Document | null> {
    const row = await this.prisma.document.findFirst({
      where: { tenantId, sourceKey },
      orderBy: { version: "desc" },
    });
    if (!row) return null;
    return mapDocument(row);
  }

  async findBySourceKeyAndContentHash(
    tenantId: TenantId,
    sourceKey: string,
    contentHash: string,
  ): Promise<Document | null> {
    const row = await this.prisma.document.findFirst({
      where: { tenantId, sourceKey, contentHash },
    });
    if (!row) return null;
    return mapDocument(row);
  }

  async getContentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Buffer | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { content: true, storageKey: true },
    });
    if (!row) return null;

    if (row.storageKey) {
      if (!this.storage) {
        throw new Error(
          `Document ${documentId} has storage_key but ObjectStorage is not configured`,
        );
      }
      return this.storage.get(row.storageKey);
    }

    return Buffer.from(row.content);
  }

  async listByTenantId(tenantId: TenantId): Promise<Document[]> {
    const rows = await this.prisma.document.findMany({
      where: { tenantId },
      orderBy: [{ sourceKey: "asc" }, { version: "asc" }, { id: "asc" }],
    });
    return rows.map(mapDocument);
  }

  async listBySourceKey(
    tenantId: TenantId,
    sourceKey: string,
  ): Promise<Document[]> {
    const rows = await this.prisma.document.findMany({
      where: { tenantId, sourceKey },
      orderBy: [{ version: "asc" }, { id: "asc" }],
    });
    return rows.map(mapDocument);
  }

  async listPage(
    tenantId: TenantId,
    opts: ListDocumentsOpts = {},
  ): Promise<ListDocumentsPage> {
    const limit = clampDocumentListLimit(opts.limit);
    const statusFilter = opts.status?.trim() || undefined;
    const sourceKeyFilter = opts.sourceKey?.trim() || undefined;
    const baseWhere = {
      tenantId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(sourceKeyFilter ? { sourceKey: sourceKeyFilter } : {}),
    };
    const total = await this.prisma.document.count({ where: baseWhere });

    if (opts.cursor) {
      const decoded = decodeDocumentCursor(opts.cursor);
      if (!decoded) {
        return {
          items: [],
          total,
          limit,
          offset: 0,
          nextCursor: null,
        };
      }

      const where: Prisma.DocumentWhereInput = {
        ...baseWhere,
        OR: [
          { sourceKey: { gt: decoded.sk } },
          {
            sourceKey: decoded.sk,
            version: { gt: decoded.v },
          },
          {
            sourceKey: decoded.sk,
            version: decoded.v,
            id: { gt: decoded.id },
          },
        ],
      };

      const rows = await this.prisma.document.findMany({
        where,
        orderBy: [{ sourceKey: "asc" }, { version: "asc" }, { id: "asc" }],
        take: limit + 1,
      });
      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const items = pageRows.map(mapDocument);
      return {
        items,
        total,
        limit,
        offset: 0,
        nextCursor:
          hasMore && items.length > 0
            ? encodeDocumentCursor(items[items.length - 1]!)
            : null,
      };
    }

    const offset = Math.max(0, Math.floor(opts.offset ?? 0));
    const rows = await this.prisma.document.findMany({
      where: baseWhere,
      orderBy: [{ sourceKey: "asc" }, { version: "asc" }, { id: "asc" }],
      skip: offset,
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = pageRows.map(mapDocument);
    return {
      items,
      total,
      limit,
      offset,
      nextCursor:
        hasMore && items.length > 0
          ? encodeDocumentCursor(items[items.length - 1]!)
          : null,
    };
  }

  async deleteForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<void> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { id: true, storageKey: true },
    });
    if (!row) {
      throw new DocumentNotFoundError(documentId);
    }
    if (row.storageKey && this.storage) {
      await this.storage.delete(row.storageKey);
    }
    await this.prisma.document.delete({ where: { id: documentId } });
  }

  async updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: DocumentStatus,
  ): Promise<Document> {
    const existing = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!existing) {
      throw new DocumentNotFoundError(documentId);
    }
    const row = await this.prisma.document.update({
      where: { id: documentId },
      data: { status },
    });
    return mapDocument(row);
  }
}

function mapDocument(row: {
  id: string;
  tenantId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  status: string;
  sourceKey: string;
  version: number;
  contentHash: string;
  createdAt: Date;
}): Document {
  return {
    id: row.id,
    tenantId: row.tenantId,
    filename: row.filename,
    contentType: row.contentType,
    byteSize: row.byteSize,
    status: row.status as DocumentStatus,
    sourceKey: row.sourceKey,
    version: row.version,
    contentHash: row.contentHash,
    createdAt: toIso(row.createdAt),
  };
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
