import { describe, expect, it } from "vitest";
import {
  clampParseConfidence,
  segmentTextWithTables,
} from "./table-evidence";
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
import { RetrieveUseCase } from "../retrieve/retrieve";
import { newChunkId } from "./process-parse-job";
import type { Chunk, Document, DocumentId, TenantId } from "@amkp/domain";

const GOLD_MD = `# Revenue report

| Product | Q1 | Q2 |
| --- | --- | --- |
| Alpha | 10 | 12 |
| Beta | 7 | 9 |

Notes follow the table.
`;

describe("segmentTextWithTables", () => {
  it("extracts markdown TableEvidence", () => {
    const segs = segmentTextWithTables(GOLD_MD);
    const table = segs.find((s) => s.kind === "table");
    expect(table?.table).toEqual({
      headers: ["Product", "Q1", "Q2"],
      rows: [
        ["Alpha", "10", "12"],
        ["Beta", "7", "9"],
      ],
    });
  });

  it("clamps parseConfidence to [0,1]", () => {
    expect(clampParseConfidence(1.5)).toBe(1);
    expect(clampParseConfidence(-0.2)).toBe(0);
    expect(clampParseConfidence(0.42)).toBe(0.42);
  });
});

class FakeDocs implements DocumentRepository {
  private store = new Map<string, Document & { content: Buffer }>();

  async create(input: {
    tenantId: TenantId;
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<Document> {
    const id = `doc_${this.store.size + 1}`;
    const doc: Document & { content: Buffer } = {
      id,
      tenantId: input.tenantId,
      filename: input.filename,
      contentType: input.contentType,
      byteSize: input.content.length,
      status: "pending",
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

  async getContentForTenant(tenantId: TenantId, documentId: DocumentId) {
    return this.store.get(`${tenantId}:${documentId}`)?.content ?? null;
  }

  async listByTenantId() {
    return [];
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
    _tenantId: TenantId,
    _documentId: DocumentId,
    chunks: CreateChunkInput[],
  ) {
    this.rows = chunks.map((c) => ({
      id: newChunkId(),
      tenantId: c.tenantId,
      documentId: c.documentId,
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
    _payload: { tenantId: TenantId; documentId: DocumentId },
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

describe("TableEvidence parse → retrieve gold fixture", () => {
  it("returns TableEvidence and parseConfidence in [0,1]", async () => {
    const ctx = {
      tenantId: "ten_gold",
      accountId: "acc_gold",
      apiKeyId: "key_gold",
    };
    const docs = new FakeDocs();
    const chunks = new FakeChunks();
    const index = new FakeIndex();
    const ladder: ParseLadderPort = {
      async extractTier1(): Promise<ParsedText> {
        return { text: GOLD_MD, confidence: 0.88, usedVlm: false };
      },
      async extractTier2(): Promise<ParsedText> {
        return { text: GOLD_MD, confidence: 0.9, usedVlm: false };
      },
      async extractTier3(): Promise<ParsedText> {
        return {
          text: "unused",
          confidence: 0.1,
          usedVlm: true,
          spendUsd: 0.02,
        };
      },
    };

    const ingest = new IngestDocumentUseCase(docs, new FakeQueue());
    const created = await ingest.execute(ctx, {
      filename: "revenue.md",
      contentType: "text/markdown",
      content: Buffer.from(GOLD_MD),
    });

    const tenants = {
      async findById(id: string) {
        return {
          id,
          accountId: ctx.accountId,
          name: "docs",
          agenticEnabled: false,
          pageVisionEnabled: false,
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

    const parse = new ProcessParseJobUseCase(
      docs,
      chunks,
      ladder,
      index,
      tenants,
    );
    const parsed = await parse.execute({
      tenantId: ctx.tenantId,
      documentId: created.document.id,
    });
    expect(parsed.tableChunkCount).toBe(1);
    expect(parsed.usedVlm).toBe(false);

    const retrieve = new RetrieveUseCase(index);
    const envelope = await retrieve.execute(
      ctx,
      { query: "Alpha" },
      { requestId: "req_gold" },
    );
    expect(envelope.outcome.kind).toBe("evidence");
    if (envelope.outcome.kind === "evidence") {
      const withTable = envelope.outcome.items.find((i) => i.table);
      expect(withTable?.table?.headers).toEqual(["Product", "Q1", "Q2"]);
      expect(withTable?.table?.rows?.[0]).toEqual(["Alpha", "10", "12"]);
      expect(withTable?.parseConfidence).toBeGreaterThanOrEqual(0);
      expect(withTable?.parseConfidence).toBeLessThanOrEqual(1);
    }
  });
});
