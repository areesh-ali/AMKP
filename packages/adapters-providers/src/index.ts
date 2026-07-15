/** Embedding / VLM provider adapters — ports live in @amkp/application. */
export type { EmbeddingProvider } from "@amkp/application";

export {
  LocalParseLadder,
  extractPdfTextLayer,
  createPageVisionLedger,
} from "./local-parse-ladder";
export { StubEmbeddingProvider } from "./stub-embedding-provider";
export {
  OpenAiEmbeddingProvider,
  createEmbeddingProviderFromEnv,
} from "./openai-embedding-provider";
