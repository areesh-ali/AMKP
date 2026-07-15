import type { IndexedChunk, VectorIndexPort } from "@amkp/application";

/** In-process vector index stub — namespace isolation for tests / MVP until pgvector retrieve. */
export class InMemoryVectorIndex implements VectorIndexPort {
  private readonly chunks: IndexedChunk[] = [];

  async upsert(chunk: IndexedChunk): Promise<void> {
    this.chunks.push({ ...chunk });
  }

  async search(input: {
    namespace: string;
    query: string;
    limit?: number;
  }): Promise<IndexedChunk[]> {
    const q = input.query.toLowerCase();
    const limit = input.limit ?? 10;
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .slice(0, limit)
      .map((c) => ({ ...c, score: 1 }));
  }

  /** Test helper — not part of port. */
  clear(): void {
    this.chunks.length = 0;
  }
}
