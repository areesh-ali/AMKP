-- Shared Tenant-namespaced vector index (replaces process-local InMemoryVectorIndex).
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "vector_chunks" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "document_version_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parse_tier" TEXT,
    "parse_confidence" DOUBLE PRECISION,
    "table_json" JSONB,
    "source_key" TEXT,
    "version" INTEGER,
    "content_hash" TEXT,
    "embedding" vector(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vector_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vector_chunks_namespace_idx" ON "vector_chunks"("namespace");
CREATE INDEX "vector_chunks_tenant_id_idx" ON "vector_chunks"("tenant_id");
CREATE INDEX "vector_chunks_embedding_hnsw_idx" ON "vector_chunks"
  USING hnsw ("embedding" vector_cosine_ops);
