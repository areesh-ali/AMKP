import {
  STUB_EMBEDDING_DIMS,
  type EmbeddingProvider,
} from "@amkp/application";
import { StubEmbeddingProvider } from "./stub-embedding-provider";

/**
 * OpenAI-compatible embeddings (OpenAI, Azure OpenAI, local gateways).
 * Falls back to StubEmbeddingProvider when AMKP_EMBEDDING_API_KEY is unset
 * and createEmbeddingProviderFromEnv is used.
 */
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;

  constructor(
    private readonly options: {
      apiKey: string;
      model?: string;
      baseUrl?: string;
      dimensions?: number;
    },
  ) {
    this.dimensions = options.dimensions ?? 64;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const base = (this.options.baseUrl ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    const res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model ?? "text-embedding-3-small",
        input: texts,
        dimensions: this.dimensions,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Embedding provider HTTP ${res.status}: ${body}`);
    }
    const json = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
    };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    return sorted.map((d) => {
      const emb = d.embedding;
      if (emb.length === this.dimensions) return emb;
      // Pad/truncate to configured dims so pgvector column stays compatible.
      if (emb.length > this.dimensions) return emb.slice(0, this.dimensions);
      return [...emb, ...new Array(this.dimensions - emb.length).fill(0)];
    });
  }
}

export function createEmbeddingProviderFromEnv(): EmbeddingProvider {
  const apiKey = process.env.AMKP_EMBEDDING_API_KEY?.trim();
  if (apiKey) {
    return new OpenAiEmbeddingProvider({
      apiKey,
      model: process.env.AMKP_EMBEDDING_MODEL,
      baseUrl: process.env.AMKP_EMBEDDING_BASE_URL,
      dimensions: process.env.AMKP_EMBEDDING_DIMS
        ? Number(process.env.AMKP_EMBEDDING_DIMS)
        : STUB_EMBEDDING_DIMS,
    });
  }
  return new StubEmbeddingProvider();
}
