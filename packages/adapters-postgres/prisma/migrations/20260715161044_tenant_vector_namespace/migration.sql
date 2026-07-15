-- Add nullable, backfill from tenant id, then enforce NOT NULL + UNIQUE
ALTER TABLE "tenants" ADD COLUMN "vector_namespace" TEXT;

UPDATE "tenants" SET "vector_namespace" = 'ns_' || "id" WHERE "vector_namespace" IS NULL;

ALTER TABLE "tenants" ALTER COLUMN "vector_namespace" SET NOT NULL;

CREATE UNIQUE INDEX "tenants_vector_namespace_key" ON "tenants"("vector_namespace");
