-- CreateTable
CREATE TABLE "chunks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parse_tier" TEXT NOT NULL,
    "parse_confidence" DOUBLE PRECISION NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chunks_tenant_id_document_id_idx" ON "chunks"("tenant_id", "document_id");

-- AddForeignKey
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
