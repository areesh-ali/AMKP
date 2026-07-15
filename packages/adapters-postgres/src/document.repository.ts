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
} from "@amkp/application";
import { DocumentNotFoundError } from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { toIso } from "./crypto";

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    const id = `doc_${ulid()}`;
    const row = await this.prisma.document.create({
      data: {
        id,
        tenantId: input.tenantId,
        filename: input.filename,
        contentType: input.contentType,
        byteSize: input.content.length,
        content: input.content,
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

  async getContentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Buffer | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { content: true },
    });
    if (!row) return null;
    return Buffer.from(row.content);
  }

  async listByTenantId(tenantId: TenantId): Promise<Document[]> {
    const rows = await this.prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapDocument);
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
  createdAt: Date;
}): Document {
  return {
    id: row.id,
    tenantId: row.tenantId,
    filename: row.filename,
    contentType: row.contentType,
    byteSize: row.byteSize,
    status: row.status as DocumentStatus,
    createdAt: toIso(row.createdAt),
  };
}
