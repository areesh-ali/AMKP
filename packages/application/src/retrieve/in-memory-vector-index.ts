import type { IndexedChunk, VectorIndexPort } from "./retrieve";

/**
 * In-process hybrid index for tests / ephemeral mode.
 * Lexical: term overlap. Dense stub: match-span density in content.
 */
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
    const q = (input.query ?? "").trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    const limit = input.limit ?? 10;

    const scored = [...this.byId.values()]
      .filter((c) => c.namespace === input.namespace)
      .map((c) => {
        const content = c.content.toLowerCase();
        const lexical = lexicalScore(content, terms);
        const dense = denseStubScore(content, q);
        if (lexical <= 0 && dense <= 0) return null;
        const score = 0.6 * lexical + 0.4 * dense;
        return { ...c, score };
      })
      .filter((c): c is IndexedChunk & { score: number } => c !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);

    return scored;
  }

  clear(): void {
    this.byId.clear();
  }

  async deleteByDocument(input: {
    namespace: string;
    documentId: string;
  }): Promise<void> {
    for (const [key, chunk] of this.byId) {
      if (
        chunk.namespace === input.namespace &&
        chunk.documentId === input.documentId
      ) {
        this.byId.delete(key);
      }
    }
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

function denseStubScore(content: string, query: string): number {
  if (
    !content.includes(query) &&
    !query.split(/\s+/).some((t) => content.includes(t))
  ) {
    return 0;
  }
  const len = Math.max(content.length, 1);
  return Math.min(1, (query.length + 8) / Math.sqrt(len));
}
