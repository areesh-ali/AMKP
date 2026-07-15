import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import type { Document, DocumentId, TenantId, Chunk } from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  IngestDocumentUseCase,
  hashDocumentContent,
} from "./ingest-document";
import { ProcessParseJobUseCase, newChunkId } from "./process-parse-job";
import type {
  DocumentRepository,
  JobQueuePort,
  EnqueueResult,
} from "./ports";
import type {
  ChunkRepository,
  CreateChunkInput,
  ParseLadderPort,
  ParsedText,
} from "./parse-ports";
import {
  RetrieveUseCase,
  preferLatestVersions,
  type IndexedChunk,
  type VectorIndexPort,
} from "../retrieve/retrieve";

class FakeDocs implements DocumentRepository {
  store = new Map<string, Document & { content: Buffer }>();

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
    const { content: _c, ...meta } = doc;
    return meta;
  }

  async findByIdForTenant(tenantId: TenantId, documentId: DocumentId) {
    const row = this.store.get(`${tenantId}:${documentId}`);
    if (!row) return null;
    const { content: _c, ...meta } = row;
    return meta;
  }

  async findLatestBySourceKey(tenantId: TenantId, sourceKey: string) {
    const rows = [...this.store.values()]
      .filter((d) => d.tenantId === tenantId && d.sourceKey === sourceKey)
      .sort((a, b) => b.version - a.version);
    if (!rows[0]) return null;
    const { content: _c, ...meta } = rows[0];
    return meta;
  }

  async getContentForTenant(tenantId: TenantId, documentId: DocumentId) {
    return this.store.get(`${tenantId}:${documentId}`)?.content ?? null;
  }

  async listByTenantId(tenantId: TenantId) {
    return [...this.store.values()]
      .filter((d) => d.tenantId === tenantId)
      .map(({ content: _c, ...meta }) => meta);
  }

  async updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: Document["status"],
  ) {
    const row = this.store.get(`${tenantId}:${documentId}`)!;
    row.status = status;
    const { content: _c, ...meta } = row;
    return meta;
  }
}

class FakeChunks implements ChunkRepository {
  rows: Chunk[] = [];
  async replaceForDocument(
    _t: TenantId,
    _d: DocumentId,
    chunks: CreateChunkInput[],
  ) {
    this.rows = chunks.map((c) => ({
      id: newChunkId(),
      tenantId: c.tenantId,
      documentId: c.documentId,
      documentVersionId: c.documentVersionId,
      content: c.content,
      parseTier: c.parseTier,
      parseConfidence: c.parseConfidence,
      ordinal: c.ordinal,
      table: c.table,
      createdAt: new Date().toISOString(),
    }));
    return this.rows;
  }
  async listByDocumentForTenant() {
    return this.rows;
  }
}

class FakeQueue implements JobQueuePort {
  async enqueue(
    queue: "ingest" | "parse" | "eval",
    _p: { tenantId: TenantId; documentId: DocumentId },
    options?: { jobId?: string },
  ): Promise<EnqueueResult> {
    return { jobId: options?.jobId ?? "job_x", queue };
  }
}

class FakeIndex implements VectorIndexPort {
  items: IndexedChunk[] = [];
  async upsert(chunk: IndexedChunk) {
    this.items.push(chunk);
  }
  async search(input: { namespace: string; query: string; limit?: number }) {
    const q = input.query.toLowerCase();
    return this.items
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .slice(0, input.limit ?? 10);
  }
}

const tenants = {
  async findById(id: string) {
    return {
      id,
      accountId: "acc_a",
      name: "t",
      agenticEnabled: false,
      pageVisionEnabled: false,
      preferCorrectnessThreshold: 0.5,
      agenticReadinessPassed: false,
      vectorNamespace: `ns_${id}`,
      createdAt: new Date().toISOString(),
    };
  },
  async create() {
    throw new Error("unused");
  },
  async listByAccountId() {
    return [];
  },
  async updateSettings() {
    throw new Error("unused");
  },
};

describe("Document version watermark (T-2.5)", () => {
  const ctx = {
    tenantId: "ten_a",
    accountId: "acc_a",
    apiKeyId: "key_a",
  };

  it("re-ingest increments version and hashes content", async () => {
    const docs = new FakeDocs();
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const v1 = await ingest.execute(ctx, {
      filename: "policy.md",
      sourceKey: "policy",
      contentType: "text/markdown",
      content: Buffer.from("policy v1 refund 30 days"),
    });
    const v2 = await ingest.execute(ctx, {
      filename: "policy.md",
      sourceKey: "policy",
      contentType: "text/markdown",
      content: Buffer.from("policy v2 refund 14 days"),
    });

    expect(v1.document.version).toBe(1);
    expect(v2.document.version).toBe(2);
    expect(v1.document.sourceKey).toBe("policy");
    expect(v2.document.contentHash).toBe(
      hashDocumentContent(Buffer.from("policy v2 refund 14 days")),
    );
    expect(v1.document.id).not.toBe(v2.document.id);
  });

  it("retrieve prefers latest version and exposes documentVersionId", async () => {
    const docs = new FakeDocs();
    const index = new FakeIndex();
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const ladder: ParseLadderPort = {
      async extractTier1(input): Promise<ParsedText> {
        return {
          text: input.content.toString("utf8"),
          confidence: 0.9,
          usedVlm: false,
        };
      },
      async extractTier2(input): Promise<ParsedText> {
        return {
          text: input.content.toString("utf8"),
          confidence: 0.9,
          usedVlm: false,
        };
      },
      async extractTier3(): Promise<ParsedText> {
        return { text: "", confidence: 0, usedVlm: true, spendUsd: 0 };
      },
    };

    const v1 = await ingest.execute(ctx, {
      filename: "policy.md",
      sourceKey: "policy",
      content: Buffer.from("refund window is 30 days"),
    });
    await new ProcessParseJobUseCase(
      docs,
      new FakeChunks(),
      ladder,
      index,
      tenants,
    ).execute({ tenantId: ctx.tenantId, documentId: v1.document.id });

    const v2 = await ingest.execute(ctx, {
      filename: "policy.md",
      sourceKey: "policy",
      content: Buffer.from("refund window is 14 days"),
    });
    await new ProcessParseJobUseCase(
      docs,
      new FakeChunks(),
      ladder,
      index,
      tenants,
    ).execute({ tenantId: ctx.tenantId, documentId: v2.document.id });

    const retrieve = new RetrieveUseCase(index);
    const envelope = await retrieve.execute(
      ctx,
      { query: "refund window" },
      { requestId: "req_v" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      expect(envelope.outcome.items).toHaveLength(1);
      expect(envelope.outcome.items[0]?.content).toContain("14 days");
      expect(envelope.outcome.items[0]?.documentVersionId).toBe(
        v2.document.id,
      );
      expect(
        envelope.outcome.items.every((i) => !i.content?.includes("30 days")),
      ).toBe(true);
    }
  });

  it("preferLatestVersions keeps max version per sourceKey", () => {
    const ns = tenantVectorNamespace("ten_a");
    const filtered = preferLatestVersions([
      {
        id: "1",
        tenantId: "ten_a",
        namespace: ns,
        documentId: "d1",
        content: "old",
        sourceKey: "policy",
        version: 1,
        documentVersionId: "d1",
      },
      {
        id: "2",
        tenantId: "ten_a",
        namespace: ns,
        documentId: "d2",
        content: "new",
        sourceKey: "policy",
        version: 2,
        documentVersionId: "d2",
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.version).toBe(2);
  });

  it("hashDocumentContent is sha256 hex", () => {
    const buf = Buffer.from("abc");
    expect(hashDocumentContent(buf)).toBe(
      createHash("sha256").update(buf).digest("hex"),
    );
  });
});
