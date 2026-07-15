-- Content-addressed uniqueness: concurrent identical ingests cannot create
-- two Documents for the same tenant+sourceKey+contentHash.
CREATE UNIQUE INDEX "documents_tenant_id_source_key_content_hash_key"
  ON "documents" ("tenant_id", "source_key", "content_hash");
