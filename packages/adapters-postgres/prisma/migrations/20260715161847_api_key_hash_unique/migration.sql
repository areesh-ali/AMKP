DROP INDEX IF EXISTS "api_keys_key_hash_idx";
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
