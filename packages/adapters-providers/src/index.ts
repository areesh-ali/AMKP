/** Embedding / VLM provider adapters — ports live in @amkp/application. */
export type { EmbeddingProvider } from "@amkp/application";

export {
  LocalParseLadder,
  extractPdf,
  extractPdfTextLayer,
  createPageVisionLedger,
} from "./local-parse-ladder";
export { StubEmbeddingProvider } from "./stub-embedding-provider";
export {
  OpenAiEmbeddingProvider,
  createEmbeddingProviderFromEnv,
} from "./openai-embedding-provider";
export {
  HttpPageVisionProvider,
  createPageVisionProviderFromEnv,
} from "./http-page-vision";
export {
  HttpEvalJudge,
  createEvalJudgeFromEnv,
} from "./http-eval-judge";
export {
  HttpDocumentStatusNotifier,
  createDocumentStatusNotifierFromEnv,
  verifyAmkpWebhookSignature,
} from "./http-document-webhook";
export { OtelApiTracer } from "./otel-tracer";
export { startAmkpOtel } from "./otel-bootstrap";
export { createAmkpTracerFromEnv } from "./create-tracer";
