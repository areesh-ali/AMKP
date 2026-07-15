import type {
  EmbeddingProvider,
  IndexedChunk,
  VectorIndexPort,
} from "@amkp/application";
import {
  embeddingToPgVectorLiteral,
  stubEmbedText,
  STUB_EMBEDDING_DIMS,
} from "@amkp/application";
import type { PrismaClient } from "./prisma";

type Row = {
  id: string;
  namespace: string;
  tenant_id: string;
  document_id: string;
  document_version_id: string;
  content: string;
  parse_tier: string | null;
  parse_confidence: number | null;
  table_json: unknown;
  source_key: string | null;
  version: number | null;
  content_hash: string | null;
  dense: number;
};

class DefaultStubEmbedder implements EmbeddingProvider {
  readonly dimensions = STUB_EMBEDDING_DIMS;
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => stubEmbedText(t, this.dimensions));
  }
}

/**
 * Shared Postgres + pgvector index (AD-3).
 * Hybrid: cosine dense via EmbeddingProvider + lexical overlap.
 */
export class PostgresVectorIndex implements VectorIndexPort {
  private readonly embedder: EmbeddingProvider;

  constructor(
    private readonly prisma: PrismaClient,
    embedder?: EmbeddingProvider,
  ) {
    this.embedder = embedder ?? new DefaultStubEmbedder();
  }

  async upsert(chunk: IndexedChunk): Promise<void> {
    const [vec] = await this.embedder.embed([chunk.content]);
    const emb = embeddingToPgVectorLiteral(vec ?? stubEmbedText(chunk.content));
    const tableJson = chunk.table ? JSON.stringify(chunk.table) : null;

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO vector_chunks (
        id, namespace, tenant_id, document_id, document_version_id,
        content, parse_tier, parse_confidence, table_json,
        source_key, version, content_hash, embedding, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9::jsonb,
        $10, $11, $12, $13::vector, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        namespace = EXCLUDED.namespace,
        tenant_id = EXCLUDED.tenant_id,
        document_id = EXCLUDED.document_id,
        document_version_id = EXCLUDED.document_version_id,
        content = EXCLUDED.content,
        parse_tier = EXCLUDED.parse_tier,
        parse_confidence = EXCLUDED.parse_confidence,
        table_json = EXCLUDED.table_json,
        source_key = EXCLUDED.source_key,
        version = EXCLUDED.version,
        content_hash = EXCLUDED.content_hash,
        embedding = EXCLUDED.embedding
      `,
      chunk.id,
      chunk.namespace,
      chunk.tenantId,
      chunk.documentId,
      chunk.documentVersionId ?? chunk.documentId,
      chunk.content,
      chunk.parseTier ?? null,
      chunk.parseConfidence ?? null,
      tableJson,
      chunk.sourceKey ?? null,
      chunk.version ?? null,
      chunk.contentHash ?? null,
      emb,
    );
  }

  async search(input: {
    namespace: string;
    query: string;
    limit?: number;
  }): Promise<IndexedChunk[]> {
    const q = (input.query ?? "").trim();
    if (!q) return [];
    const limit = input.limit ?? 10;
    const candidateLimit = Math.max(limit * 5, 50);
    const [vec] = await this.embedder.embed([q]);
    const emb = embeddingToPgVectorLiteral(vec ?? stubEmbedText(q));
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

    const rows = await this.prisma.$queryRawUnsafe<Row[]>(
      `
      SELECT
        id, namespace, tenant_id, document_id, document_version_id,
        content, parse_tier, parse_confidence, table_json,
        source_key, version, content_hash,
        (1 - (embedding <=> $1::vector))::float8 AS dense
      FROM vector_chunks
      WHERE namespace = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
      `,
      emb,
      input.namespace,
      candidateLimit,
    );

    const scored: IndexedChunk[] = [];
    for (const r of rows) {
      const content = r.content.toLowerCase();
      const lexical = lexicalScore(content, terms);
      const dense = Math.max(0, Number(r.dense) || 0);
      if (lexical <= 0 && dense <= 0) continue;
      const score = 0.6 * lexical + 0.4 * dense;
      scored.push({
        id: r.id,
        tenantId: r.tenant_id,
        namespace: r.namespace,
        documentId: r.document_id,
        documentVersionId: r.document_version_id,
        content: r.content,
        parseTier: r.parse_tier ?? undefined,
        parseConfidence: r.parse_confidence ?? undefined,
        table: parseTable(r.table_json),
        sourceKey: r.source_key ?? undefined,
        version: r.version ?? undefined,
        contentHash: r.content_hash ?? undefined,
        score,
      });
    }

    return scored
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  async clear(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE vector_chunks`);
  }

  async deleteByDocument(input: {
    namespace: string;
    documentId: string;
  }): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM vector_chunks WHERE namespace = $1 AND document_id = $2`,
      input.namespace,
      input.documentId,
    );
  }
}

function lexicalScore(content: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  let hits = 0;
  for (const t of terms) {
    if (content.includes(t)) hits += 1;
  }
  return hits / terms.length;
}

function parseTable(value: unknown): IndexedChunk["table"] {
  if (!value || typeof value !== "object") return undefined;
  return value as IndexedChunk["table"];
}
