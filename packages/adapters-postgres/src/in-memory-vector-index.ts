import type { IndexedChunk, VectorIndexPort } from "@amkp/application";

/** In-process vector index stub — MVP until pgvector retrieve adapter. */
export class InMemoryVectorIndex implements VectorIndexPort {
  private readonly byId = new Map<string, IndexedChunk>();

  async upsert(chunk: IndexedChunk): Promise<void> {
    this.byId.set(`${chunk.namespace}:${chunk.id}`, { ...chunk });
  }

  async search(input: {
    namespace: string;
    query: string;
    limit?: number;
  }): Promise<IndexedChunk[]> {
    const q = (input.query ?? "").toLowerCase();
    if (!q) return [];
    const limit = input.limit ?? 10;
    return [...this.byId.values()]
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .slice(0, limit)
      .map((c) => ({ ...c, score: 1 }));
  }

  clear(): void {
    this.byId.clear();
  }
}
