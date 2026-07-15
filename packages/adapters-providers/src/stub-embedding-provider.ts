import {
  stubEmbedText,
  STUB_EMBEDDING_DIMS,
  type EmbeddingProvider,
} from "@amkp/application";

/** MVP embedding provider — deterministic lexical hash vectors (64-dim). */
export class StubEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = STUB_EMBEDDING_DIMS;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => stubEmbedText(t, this.dimensions));
  }
}
