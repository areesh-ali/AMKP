import { describe, expect, it } from "vitest";
import { ReparseDocumentUseCase } from "./reparse-document";
import type { DocumentRepository, JobQueuePort } from "./ports";
import type { Document } from "@amkp/domain";
import { DocumentNotFoundError } from "./ports";

class FakeDocs implements DocumentRepository {
  status = "parsed";
  async create(): Promise<Document> {
    throw new Error("n/a");
  }
  async findByIdForTenant(tenantId: string, documentId: string) {
    if (tenantId !== "ten_a" || documentId !== "doc_1") return null;
    return {
      id: "doc_1",
      tenantId: "ten_a",
      filename: "a.md",
      contentType: "text/markdown",
      byteSize: 1,
      status: this.status as Document["status"],
      sourceKey: "a",
      version: 1,
      contentHash: "h",
      createdAt: new Date().toISOString(),
    };
  }
  async findLatestBySourceKey() {
    return null;
  }
  async findBySourceKeyAndContentHash() {
    return null;
  }
  async getContentForTenant() {
    return Buffer.from("x");
  }
  async listByTenantId() {
    return [];
  }
  async listBySourceKey() {
    return [];
  }
  async listPage() {
    return { items: [], total: 0, limit: 50, offset: 0, nextCursor: null };
  }
  async deleteForTenant() {}
  async updateStatus(_t: string, _d: string, status: Document["status"]) {
    this.status = status;
    return (await this.findByIdForTenant("ten_a", "doc_1"))!;
  }
}

class FakeQueue implements JobQueuePort {
  jobs: string[] = [];
  async enqueue(queue: "ingest" | "parse" | "eval") {
    this.jobs.push(queue);
    return { jobId: `job_${this.jobs.length}`, queue };
  }
}

describe("ReparseDocumentUseCase", () => {
  it("enqueues parse and sets parse_queued", async () => {
    const docs = new FakeDocs();
    const queue = new FakeQueue();
    const uc = new ReparseDocumentUseCase(docs, queue);
    const out = await uc.execute(
      { tenantId: "ten_a", accountId: "acc_a", apiKeyId: "key_a" },
      "doc_1",
    );
    expect(out.status).toBe("parse_queued");
    expect(queue.jobs).toEqual(["parse"]);
    expect(docs.status).toBe("parse_queued");
  });

  it("404s for unknown document", async () => {
    const uc = new ReparseDocumentUseCase(new FakeDocs(), new FakeQueue());
    await expect(
      uc.execute(
        { tenantId: "ten_a", accountId: "acc_a", apiKeyId: "key_a" },
        "missing",
      ),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});
