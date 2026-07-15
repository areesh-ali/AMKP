-- AlterTable documents: version watermark fields
ALTER TABLE "documents" ADD COLUMN "source_key" TEXT;
ALTER TABLE "documents" ADD COLUMN "version" INTEGER;
ALTER TABLE "documents" ADD COLUMN "content_hash" TEXT;

UPDATE "documents"
SET
  "source_key" = "filename",
  "version" = 1,
  "content_hash" = encode(sha256("content"), 'hex')
WHERE "source_key" IS NULL;

ALTER TABLE "documents" ALTER COLUMN "source_key" SET NOT NULL;
ALTER TABLE "documents" ALTER COLUMN "version" SET NOT NULL;
ALTER TABLE "documents" ALTER COLUMN "content_hash" SET NOT NULL;

CREATE UNIQUE INDEX "documents_tenant_id_source_key_version_key" ON "documents"("tenant_id", "source_key", "version");
CREATE INDEX "documents_tenant_id_source_key_idx" ON "documents"("tenant_id", "source_key");

-- AlterTable chunks: document_version_id
ALTER TABLE "chunks" ADD COLUMN "document_version_id" TEXT;
UPDATE "chunks" SET "document_version_id" = "document_id" WHERE "document_version_id" IS NULL;
ALTER TABLE "chunks" ALTER COLUMN "document_version_id" SET NOT NULL;
