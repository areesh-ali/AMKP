/** Deterministic 64-dim stub embedding until a real embedding provider is wired. */
export const STUB_EMBEDDING_DIMS = 64;

/**
 * Hash bag-of-terms into a unit vector for pgvector cosine distance.
 * Same text → same vector; overlapping terms → higher similarity.
 */
export function stubEmbedText(text: string, dims = STUB_EMBEDDING_DIMS): number[] {
  const vec = new Array<number>(dims).fill(0);
  const terms = (text ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) {
    vec[0] = 1;
    return vec;
  }
  for (const term of terms) {
    let h = 2166136261;
    for (let i = 0; i < term.length; i += 1) {
      h ^= term.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dims;
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

export function embeddingToPgVectorLiteral(values: number[]): string {
  return `[${values.map((v) => Number(v).toFixed(8)).join(",")}]`;
}
