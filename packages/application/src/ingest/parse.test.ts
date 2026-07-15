import { describe, expect, it } from "vitest";
import type { Document, DocumentId, TenantId, Chunk } from "@amkp/domain";
import { IngestDocumentUseCase } from "./ingest-document";
import { ProcessParseJobUseCase } from "./process-parse-job";
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
import type { IndexedChunk, VectorIndexPort } from "../retrieve/retrieve";
import { newChunkId } from "./process-parse-job";

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
    return omitContent(doc);
  }

  async findLatestBySourceKey(tenantId: TenantId, sourceKey: string) {
    const rows = [...this.store.values()]
      .filter((d) => d.tenantId === tenantId && d.sourceKey === sourceKey)
      .sort((a, b) => b.version - a.version);
    return rows[0] ? omitContent(rows[0]) : null;
  }

  async findByIdForTenant(tenantId: TenantId, documentId: DocumentId) {
    const row = this.store.get(`${tenantId}:${documentId}`);
    return row ? omitContent(row) : null;
  }

  async getContentForTenant(tenantId: TenantId, documentId: DocumentId) {
    return this.store.get(`${tenantId}:${documentId}`)?.content ?? null;
  }

  async listByTenantId(tenantId: TenantId) {
    return [...this.store.values()]
      .filter((d) => d.tenantId === tenantId)
      .map(omitContent);
  }

  async updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: Document["status"],
  ) {
    const row = this.store.get(`${tenantId}:${documentId}`);
    if (!row) throw new Error("missing");
    row.status = status;
    return omitContent(row);
  }
}

function omitContent(row: Document & { content: Buffer }): Document {
  const { content: _c, ...doc } = row;
  return doc;
}

class FakeChunks implements ChunkRepository {
  rows: Chunk[] = [];

  async replaceForDocument(
    tenantId: TenantId,
    documentId: DocumentId,
    chunks: CreateChunkInput[],
  ): Promise<Chunk[]> {
    this.rows = this.rows.filter(
      (c) => !(c.tenantId === tenantId && c.documentId === documentId),
    );
    const created = chunks.map((c) => ({
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
    this.rows.push(...created);
    return created;
  }

  async listByDocumentForTenant(tenantId: TenantId, documentId: DocumentId) {
    return this.rows.filter(
      (c) => c.tenantId === tenantId && c.documentId === documentId,
    );
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

class FakeIndex implements VectorIndexPort {
  items: IndexedChunk[] = [];
  async upsert(chunk: IndexedChunk) {
    this.items.push(chunk);
  }
  async search() {
    return [];
  }
}

class FakeLadder implements ParseLadderPort {
  constructor(private readonly text: string) {}
  async extractTier1(): Promise<ParsedText> {
    return { text: this.text, confidence: 0.9, usedVlm: false };
  }
  async extractTier2(): Promise<ParsedText> {
    return { text: this.text, confidence: 0.95, usedVlm: false };
  }
  async extractTier3(): Promise<ParsedText> {
    return {
      text: "should not be called",
      confidence: 0.1,
      usedVlm: true,
      spendUsd: 0.02,
    };
  }
}

class FakeTenants {
  pageVisionEnabled = false;
  async findById(id: string) {
    return {
      id,
      accountId: "acc_a",
      name: "t",
      agenticEnabled: false,
      pageVisionEnabled: this.pageVisionEnabled,
      preferCorrectnessThreshold: 0.5,
      agenticReadinessPassed: false,
      agenticMaxHops: 3,
      agenticMaxCostUsd: 0.01,
      vectorNamespace: `ns_${id}`,
      createdAt: new Date().toISOString(),
    };
  }
  async create() {
    throw new Error("unused");
  }
  async listByAccountId() {
    return [];
  }
  async updateSettings() {
    throw new Error("unused");
  }
}

const ctx = {
  tenantId: "ten_a",
  accountId: "acc_a",
  apiKeyId: "key_a",
};

describe("ProcessParseJobUseCase", () => {
  it("records tier1_text on chunks and never uses VLM", async () => {
    const docs = new FakeDocs();
    const chunks = new FakeChunks();
    const index = new FakeIndex();
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const created = await ingest.execute(ctx, {
      filename: "notes.txt",
      contentType: "text/plain",
      content: Buffer.from("Hello knowledge plane parse ladder tier one"),
    });

    const parse = new ProcessParseJobUseCase(
      docs,
      chunks,
      new FakeLadder("Hello knowledge plane parse ladder tier one"),
      index,
      new FakeTenants(),
    );
    const result = await parse.execute({
      tenantId: ctx.tenantId,
      documentId: created.document.id,
    });

    expect(result.usedVlm).toBe(false);
    expect(result.vlmSpendUsd).toBe(0);
    expect(result.parseTier).toBe("tier1_text");
    expect(result.chunkCount).toBeGreaterThan(0);
    expect(chunks.rows.every((c) => c.parseTier === "tier1_text")).toBe(true);
    expect(index.items).toHaveLength(result.chunkCount);

    const doc = await docs.findByIdForTenant(ctx.tenantId, created.document.id);
    expect(doc?.status).toBe("parsed");
  });

  it("falls back to tier2_layout when tier1 yield is empty", async () => {
    const docs = new FakeDocs();
    const chunks = new FakeChunks();
    const ladder: ParseLadderPort = {
      async extractTier1() {
        return { text: "", confidence: 0, usedVlm: false };
      },
      async extractTier2() {
        return {
          text: "Layout recovered paragraph one\n\nParagraph two",
          confidence: 0.7,
          usedVlm: false,
        };
      },
      async extractTier3() {
        return {
          text: "vlm",
          confidence: 0.5,
          usedVlm: true,
          spendUsd: 0.02,
        };
      },
    };
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const created = await ingest.execute(ctx, {
      filename: "scan.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF-1.4 empty"),
    });

    const parse = new ProcessParseJobUseCase(
      docs,
      chunks,
      ladder,
      new FakeIndex(),
      new FakeTenants(),
    );
    const result = await parse.execute({
      tenantId: ctx.tenantId,
      documentId: created.document.id,
    });
    expect(result.parseTier).toBe("tier2_layout");
    expect(result.usedVlm).toBe(false);
    expect(chunks.rows[0]?.parseTier).toBe("tier2_layout");
  });

  it("does not call VLM when pageVision disabled on scanned deck", async () => {
    let tier3Calls = 0;
    const docs = new FakeDocs();
    const ladder: ParseLadderPort = {
      async extractTier1() {
        return { text: "", confidence: 0, usedVlm: false };
      },
      async extractTier2() {
        return { text: "", confidence: 0, usedVlm: false };
      },
      async extractTier3() {
        tier3Calls += 1;
        return {
          text: "ocr text from vision",
          confidence: 0.6,
          usedVlm: true,
          spendUsd: 0.02,
        };
      },
    };
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const created = await ingest.execute(ctx, {
      filename: "scanned-deck.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF-1.4\n% binary scan"),
    });
    const tenants = new FakeTenants();
    tenants.pageVisionEnabled = false;
    const parse = new ProcessParseJobUseCase(
      docs,
      new FakeChunks(),
      ladder,
      new FakeIndex(),
      tenants,
    );
    const result = await parse.execute({
      tenantId: ctx.tenantId,
      documentId: created.document.id,
    });
    expect(tier3Calls).toBe(0);
    expect(result.usedVlm).toBe(false);
    expect(result.vlmSpendUsd).toBe(0);
  });

  it("escalates to tier3 when pageVision enabled and cheap tiers empty", async () => {
    let tier3Calls = 0;
    const docs = new FakeDocs();
    const chunks = new FakeChunks();
    const ladder: ParseLadderPort = {
      async extractTier1() {
        return { text: "", confidence: 0, usedVlm: false };
      },
      async extractTier2() {
        return { text: "", confidence: 0, usedVlm: false };
      },
      async extractTier3() {
        tier3Calls += 1;
        return {
          text: "ocr recovered slide content from scanned deck",
          confidence: 0.6,
          usedVlm: true,
          spendUsd: 0.02,
        };
      },
    };
    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const created = await ingest.execute(ctx, {
      filename: "scanned-deck.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF-1.4\n% binary scan"),
    });
    const tenants = new FakeTenants();
    tenants.pageVisionEnabled = true;
    const parse = new ProcessParseJobUseCase(
      docs,
      chunks,
      ladder,
      new FakeIndex(),
      tenants,
    );
    const result = await parse.execute({
      tenantId: ctx.tenantId,
      documentId: created.document.id,
    });
    expect(tier3Calls).toBe(1);
    expect(result.usedVlm).toBe(true);
    expect(result.vlmSpendUsd).toBe(0.02);
    expect(result.parseTier).toBe("tier3_page_vision");
    expect(chunks.rows[0]?.parseTier).toBe("tier3_page_vision");
  });
});
