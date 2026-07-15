export * from "./retrieve";
export * from "./evidence-envelope";
export * from "./cost-estimate";
export * from "./stub-embedding";
export * from "./in-memory-vector-index";

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  /** Vector dimensionality (must match pgvector column). */
  dimensions?: number;
}

export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");
