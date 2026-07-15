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
  ObjectStoragePort,
} from "@amkp/application";
import {
  DocumentNotFoundError,
  documentObjectKey,
} from "@amkp/application";
import type { PrismaClient } from "./prisma";
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
      orderBy: [{ sourceKey: "asc" }, { version: "asc" }],
    });
    return rows.map(mapDocument);
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
