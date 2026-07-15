/** Re-export stub embedding helpers from application (single source of truth). */
export {
  stubEmbedText as stubEmbedding,
  embeddingToPgVectorLiteral,
  STUB_EMBEDDING_DIMS,
} from "@amkp/application";
