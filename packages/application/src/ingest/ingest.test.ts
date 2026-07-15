import { describe, expect, it } from "vitest";
import { IngestDocumentUseCase } from "./ingest-document";
import { ListDocumentsUseCase } from "./list-documents";
import { GetDocumentUseCase } from "./get-document";
import { paginateDocumentList } from "./document-list-page";
import {
  DocumentNotFoundError,
  type DocumentRepository,
  type JobQueuePort,
  type EnqueueResult,
} from "./ports";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";
import type { Document, DocumentId, TenantId } from "@amkp/domain";

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
    return {
      id: doc.id,
      tenantId: doc.tenantId,
      filename: doc.filename,
      contentType: doc.contentType,
      byteSize: doc.byteSize,
      status: doc.status,
      sourceKey: doc.sourceKey,
      version: doc.version,
      contentHash: doc.contentHash,
      createdAt: doc.createdAt,
    };
  }

  async findLatestBySourceKey(tenantId: TenantId, sourceKey: string) {
    const rows = [...this.store.values()]
      .filter((d) => d.tenantId === tenantId && d.sourceKey === sourceKey)
      .sort((a, b) => b.version - a.version);
    if (!rows[0]) return null;
    const { content: _c, ...doc } = rows[0];
    return doc;
  }

  async findByIdForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Document | null> {
    const row = this.store.get(`${tenantId}:${documentId}`);
    if (!row) return null;
    const { content: _c, ...doc } = row;
    return doc;
  }

  async getContentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Buffer | null> {
    return this.store.get(`${tenantId}:${documentId}`)?.content ?? null;
  }

  async listByTenantId(tenantId: TenantId): Promise<Document[]> {
    return [...this.store.values()]
      .filter((d) => d.tenantId === tenantId)
      .map(({ content: _c, ...doc }) => doc);
  }

  async listPage(tenantId: TenantId, opts = {}) {
    return paginateDocumentList(await this.listByTenantId(tenantId), opts);
  }

  async deleteForTenant() {
    /* not used */
  }

  async updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: Document["status"],
  ): Promise<Document> {
    const row = this.store.get(`${tenantId}:${documentId}`);
    if (!row) throw new DocumentNotFoundError(documentId);
    row.status = status;
    const { content: _c, ...doc } = row;
    return doc;
  }
}

class FakeQueue implements JobQueuePort {
  jobs: Array<{ queue: string; payload: unknown; jobId: string }> = [];

  async enqueue(
    queue: "ingest" | "parse" | "eval",
    payload: { tenantId: TenantId; documentId: DocumentId },
    options?: { jobId?: string },
  ): Promise<EnqueueResult> {
    const jobId = options?.jobId ?? `job_auto`;
    this.jobs.push({ queue, payload, jobId });
    return { jobId, queue };
  }
}

const ctx = {
  tenantId: "ten_a",
  accountId: "acc_a",
  apiKeyId: "key_a",
};

describe("IngestDocumentUseCase", () => {
  it("creates document and enqueues ingest job", async () => {
    const docs = new FakeDocs();
    const queue = new FakeQueue();
    const uc = new IngestDocumentUseCase(docs, queue);

    const result = await uc.execute(ctx, {
      filename: "notes.txt",
      contentType: "text/plain",
      content: Buffer.from("hello"),
    });

    expect(result.document.id).toMatch(/^doc_/);
    expect(result.document.tenantId).toBe("ten_a");
    expect(result.jobId).toMatch(/^job_/);
    expect(queue.jobs).toHaveLength(1);
    expect(queue.jobs[0].queue).toBe("ingest");
    expect(queue.jobs[0].payload).toEqual({
      tenantId: "ten_a",
      documentId: result.document.id,
    });
  });

  it("fails closed without TenantContext", async () => {
    const uc = new IngestDocumentUseCase(new FakeDocs(), new FakeQueue());
    await expect(
      uc.execute(null, {
        filename: "x.txt",
        content: Buffer.from("x"),
      }),
    ).rejects.toBeInstanceOf(MissingTenantContextError);
  });

  it("rejects empty content", async () => {
    const uc = new IngestDocumentUseCase(new FakeDocs(), new FakeQueue());
    await expect(
      uc.execute(ctx, { filename: "x.txt", content: Buffer.alloc(0) }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("is idempotent for identical bytes on the same sourceKey", async () => {
    const docs = new FakeDocs();
    const queue = new FakeQueue();
    const uc = new IngestDocumentUseCase(docs, queue);
    const bytes = Buffer.from("same payload");
    const first = await uc.execute(ctx, {
      filename: "a.txt",
      sourceKey: "a",
      content: bytes,
    });
    const second = await uc.execute(ctx, {
      filename: "a.txt",
      sourceKey: "a",
      content: bytes,
    });
    expect(second.document.id).toBe(first.document.id);
    expect(second.document.version).toBe(1);
    expect(String(second.jobId)).toMatch(/^noop_/);
    expect(queue.jobs).toHaveLength(1);
  });

  it("rejects disallowed content types when allowlist is set", async () => {
    const prev = process.env.AMKP_ALLOWED_CONTENT_TYPES;
    process.env.AMKP_ALLOWED_CONTENT_TYPES = "text/plain,application/pdf";
    try {
      const uc = new IngestDocumentUseCase(new FakeDocs(), new FakeQueue());
      await expect(
        uc.execute(ctx, {
          filename: "x.bin",
          contentType: "application/octet-stream",
          content: Buffer.from("x"),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    } finally {
      if (prev === undefined) delete process.env.AMKP_ALLOWED_CONTENT_TYPES;
      else process.env.AMKP_ALLOWED_CONTENT_TYPES = prev;
    }
  });
});

describe("ListDocumentsUseCase isolation", () => {
  it("lists only caller tenant documents", async () => {
    const docs = new FakeDocs();
    const queue = new FakeQueue();
    const ingest = new IngestDocumentUseCase(docs, queue);
    const list = new ListDocumentsUseCase(docs);

    await ingest.execute(ctx, {
      filename: "a.txt",
      content: Buffer.from("a"),
    });
    await ingest.execute(
      { ...ctx, tenantId: "ten_b", apiKeyId: "key_b" },
      { filename: "b.txt", content: Buffer.from("b") },
    );

    const page = await list.execute(ctx);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].filename).toBe("a.txt");
    expect(page.total).toBe(1);
    expect(page.nextCursor).toBeNull();
  });

  it("paginates with limit and cursor", async () => {
    const docs = new FakeDocs();
    const queue = new FakeQueue();
    const ingest = new IngestDocumentUseCase(docs, queue);
    const list = new ListDocumentsUseCase(docs);

    for (const name of ["a.txt", "b.txt", "c.txt"]) {
      await ingest.execute(ctx, {
        filename: name,
        content: Buffer.from(name),
      });
    }

    const first = await list.execute(ctx, { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();

    const second = await list.execute(ctx, {
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
    expect([
      ...first.items.map((d) => d.filename),
      ...second.items.map((d) => d.filename),
    ]).toEqual(["a.txt", "b.txt", "c.txt"]);
  });
});

describe("GetDocumentUseCase", () => {
  it("does not leak other tenant documents", async () => {
    const docs = new FakeDocs();
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const get = new GetDocumentUseCase(docs);

    const created = await ingest.execute(ctx, {
      filename: "secret.txt",
      content: Buffer.from("secret"),
    });

    await expect(
      get.execute(
        { tenantId: "ten_b", accountId: "acc_b", apiKeyId: "key_b" },
        created.document.id,
      ),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});
