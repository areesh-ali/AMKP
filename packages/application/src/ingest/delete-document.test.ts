import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import { DeleteDocumentUseCase } from "./delete-document";
import { InMemoryVectorIndex } from "../retrieve/in-memory-vector-index";
import type { DocumentRepository } from "./ports";
import type { Document } from "@amkp/domain";

class FakeDocs implements DocumentRepository {
  docs = new Map<string, Document>();
  deleted: string[] = [];

  async create(): Promise<Document> {
    throw new Error("not used");
  }
  async findByIdForTenant(tenantId: string, documentId: string) {
    const d = this.docs.get(documentId);
    return d?.tenantId === tenantId ? d : null;
  }
  async findLatestBySourceKey() {
    return null;
  }
  async getContentForTenant() {
    return null;
  }
  async listByTenantId() {
    return [...this.docs.values()];
  }
  async listBySourceKey() {
    return [];
  }
  async listPage() {
    return {
      items: [...this.docs.values()],
      total: this.docs.size,
      limit: 50,
      offset: 0,
      nextCursor: null,
    };
  }
  async deleteForTenant(_tenantId: string, documentId: string) {
    this.deleted.push(documentId);
    this.docs.delete(documentId);
  }
  async updateStatus() {
    throw new Error("not used");
  }
}

describe("DeleteDocumentUseCase", () => {
  it("removes document and vector rows for Tenant namespace only", async () => {
    const docs = new FakeDocs();
    const index = new InMemoryVectorIndex();
    const tenantId = "ten_a";
    docs.docs.set("doc_1", {
      id: "doc_1",
      tenantId,
      filename: "a.pdf",
      contentType: "application/pdf",
      byteSize: 1,
      status: "parsed",
      sourceKey: "a.pdf",
      version: 1,
      contentHash: "h",
      createdAt: new Date().toISOString(),
    });
    await index.upsert({
      id: "c1",
      tenantId,
      namespace: tenantVectorNamespace(tenantId),
      documentId: "doc_1",
      content: "secret",
    });
    await index.upsert({
      id: "c2",
      tenantId: "ten_b",
      namespace: tenantVectorNamespace("ten_b"),
      documentId: "doc_other",
      content: "other",
    });

    const uc = new DeleteDocumentUseCase(docs, index);
    const out = await uc.execute(
      { tenantId, accountId: "acc_a", apiKeyId: "key_a" },
      "doc_1",
    );
    expect(out).toEqual({ documentId: "doc_1", deleted: true });
    expect(docs.deleted).toEqual(["doc_1"]);
    const left = await index.search({
      namespace: tenantVectorNamespace(tenantId),
      query: "secret",
    });
    expect(left).toHaveLength(0);
    const other = await index.search({
      namespace: tenantVectorNamespace("ten_b"),
      query: "other",
    });
    expect(other).toHaveLength(1);
  });
});
