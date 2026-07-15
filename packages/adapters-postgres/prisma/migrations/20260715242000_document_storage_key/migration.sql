-- Optional off-DB blob pointer for Document bytes (object storage).
ALTER TABLE "documents" ADD COLUMN "storage_key" TEXT;
