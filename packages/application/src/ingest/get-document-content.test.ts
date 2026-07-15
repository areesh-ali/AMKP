import { describe, expect, it } from "vitest";
import { GetDocumentContentUseCase } from "./get-document-content";
import { DocumentNotFoundError, type DocumentRepository } from "./ports";
import type { Document } from "@amkp/domain";

class FakeDocs implements DocumentRepository {
  docs = new Map<string, Document & { content: Buffer }>();

  async create(): Promise<Document> {
    throw new Error("n/a");
  }
  async findByIdForTenant(tenantId: string, documentId: string) {
    const d = this.docs.get(documentId);
    return d?.tenantId === tenantId
      ? {
          id: d.id,
          tenantId: d.tenantId,
          filename: d.filename,
          contentType: d.contentType,
          byteSize: d.byteSize,
          status: d.status,
          sourceKey: d.sourceKey,
          version: d.version,
          contentHash: d.contentHash,
          createdAt: d.createdAt,
        }
      : null;
  }
  async findLatestBySourceKey() {
    return null;
  }
  async getContentForTenant(tenantId: string, documentId: string) {
    const d = this.docs.get(documentId);
    return d?.tenantId === tenantId ? d.content : null;
  }
  async listByTenantId() {
    return [];
  }
  async listPage() {
    return { items: [], total: 0, limit: 50, offset: 0, nextCursor: null };
  }
  async deleteForTenant() {}
  async updateStatus() {
    throw new Error("n/a");
  }
}

describe("GetDocumentContentUseCase", () => {
  it("returns bytes for owning tenant only", async () => {
    const docs = new FakeDocs();
    docs.docs.set("doc_1", {
      id: "doc_1",
      tenantId: "ten_a",
      filename: "a.txt",
      contentType: "text/plain",
      byteSize: 3,
      status: "pending",
      sourceKey: "a",
      version: 1,
      contentHash: "h",
      createdAt: new Date().toISOString(),
      content: Buffer.from("abc"),
    });
    const uc = new GetDocumentContentUseCase(docs);
    const out = await uc.execute(
      { tenantId: "ten_a", accountId: "acc_a", apiKeyId: "key_a" },
      "doc_1",
    );
    expect(out.content.toString()).toBe("abc");

    await expect(
      uc.execute(
        { tenantId: "ten_b", accountId: "acc_b", apiKeyId: "key_b" },
        "doc_1",
      ),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});
