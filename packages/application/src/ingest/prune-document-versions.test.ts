import { describe, expect, it } from "vitest";
import { IngestDocumentUseCase } from "./ingest-document";
import { DeleteDocumentUseCase } from "./delete-document";
import { PruneDocumentVersionsUseCase } from "./prune-document-versions";
import {
  DocumentUniqueConflictError,
  type DocumentRepository,
  type JobQueuePort,
  type EnqueueResult,
} from "./ports";
import type { Document, DocumentId, TenantId } from "@amkp/domain";
import { paginateDocumentList } from "./document-list-page";

class FakeDocs implements DocumentRepository {
  private store = new Map<string, Document & { content: Buffer }>();

  async create(input: {
    tenantId: TenantId;
    filename: string;
    contentType: string;
    content: Buffer;
    sourceKey: string;
    contentHash: string;
    version: number;
  }): Promise<Document> {
    for (const row of this.store.values()) {
      if (
        row.tenantId === input.tenantId &&
        row.sourceKey === input.sourceKey &&
        (row.version === input.version || row.contentHash === input.contentHash)
      ) {
        throw new DocumentUniqueConflictError();
      }
    }
    const id = `doc_${this.store.size + 1}`;
    const doc: Document & { content: Buffer } = {
      id,
      tenantId: input.tenantId,
      filename: input.filename,
      contentType: input.contentType,
      byteSize: input.content.length,
      status: "pending",
      sourceKey: input.sourceKey,
      version: input.version,
      contentHash: input.contentHash,
      createdAt: new Date().toISOString(),
      content: input.content,
    };
    this.store.set(`${input.tenantId}:${id}`, doc);
    return { ...doc };
  }

  async findLatestBySourceKey(tenantId: TenantId, sourceKey: string) {
    const rows = [...this.store.values()]
      .filter((d) => d.tenantId === tenantId && d.sourceKey === sourceKey)
      .sort((a, b) => b.version - a.version);
    if (!rows[0]) return null;
    const { content: _c, ...doc } = rows[0];
    return doc;
  }

  async findBySourceKeyAndContentHash(
    tenantId: TenantId,
    sourceKey: string,
    contentHash: string,
  ) {
    const row = [...this.store.values()].find(
      (d) =>
        d.tenantId === tenantId &&
        d.sourceKey === sourceKey &&
        d.contentHash === contentHash,
    );
    if (!row) return null;
    const { content: _c, ...doc } = row;
    return doc;
  }

  async findByIdForTenant(tenantId: TenantId, documentId: DocumentId) {
    const row = this.store.get(`${tenantId}:${documentId}`);
    if (!row) return null;
    const { content: _c, ...doc } = row;
    return doc;
  }

  async getContentForTenant() {
    return null;
  }

  async listByTenantId(tenantId: TenantId) {
    return [...this.store.values()]
      .filter((d) => d.tenantId === tenantId)
      .map(({ content: _c, ...doc }) => doc);
  }

  async listBySourceKey(tenantId: TenantId, sourceKey: string) {
    return (await this.listByTenantId(tenantId))
      .filter((d) => d.sourceKey === sourceKey)
      .sort((a, b) => a.version - b.version);
  }

  async listPage(tenantId: TenantId, opts = {}) {
    return paginateDocumentList(await this.listByTenantId(tenantId), opts);
  }

  async deleteForTenant(tenantId: TenantId, documentId: DocumentId) {
    this.store.delete(`${tenantId}:${documentId}`);
  }

  async updateStatus() {
    throw new Error("unused");
  }
}

class FakeQueue implements JobQueuePort {
  async enqueue(
    queue: "ingest" | "parse" | "eval",
    payload: { tenantId: TenantId; documentId: DocumentId },
    options?: { jobId?: string },
  ): Promise<EnqueueResult> {
    return { jobId: options?.jobId ?? "job_x", queue };
  }
}

const ctx = {
  tenantId: "ten_a",
  accountId: "acc_a",
  apiKeyId: "key_a",
};

describe("PruneDocumentVersionsUseCase", () => {
  it("keeps newest N versions and deletes older", async () => {
    const docs = new FakeDocs();
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const del = new DeleteDocumentUseCase(docs);
    const prune = new PruneDocumentVersionsUseCase(docs, del);

    for (let i = 0; i < 5; i++) {
      await ingest.execute(ctx, {
        filename: "policy.pdf",
        sourceKey: "policy",
        content: Buffer.from(`v${i}`),
      });
    }

    const result = await prune.execute(ctx, "policy", 2);
    expect(result.kept).toBe(2);
    expect(result.deleted).toHaveLength(3);

    const remaining = await docs.listBySourceKey("ten_a", "policy");
    expect(remaining.map((d) => d.version)).toEqual([4, 5]);
  });
});
