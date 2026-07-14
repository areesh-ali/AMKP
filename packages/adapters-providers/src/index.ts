/** Embedding / VLM provider ports — concrete vendors land behind these. */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}
