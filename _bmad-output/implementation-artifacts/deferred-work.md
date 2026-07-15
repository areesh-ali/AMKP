# Deferred work

## Deferred from: code review of T-1.2/1.3/5.1 (2026-07-15)

- ~~**InMemoryVectorIndex as production VECTOR_INDEX**~~ — **done** (`PostgresVectorIndex` + `vector_chunks`; memory retained for tests)
- **API key hash pepper / argon2** — pepper **done** (`AMKP_API_KEY_PEPPER` → HMAC-SHA256). Argon2 remains deferred: Tenant keys are high-entropy and looked up by deterministic hash; Argon2 needs per-row salts and cannot support indexed equality lookup without a separate lookup digest.
- ~~**Move InMemoryVectorIndex out of adapters-postgres package**~~ — **done** (lives in `@amkp/application`; postgres re-exports for compat)

## Deferred from: code review of T-2.1/T-2.2 (2026-07-15)

- ~~**Worker process uses a separate InMemoryVectorIndex from API**~~ — **done** (both use `PostgresVectorIndex` by default)
- ~~**Object storage for Document bytes**~~ — **done** (`ObjectStoragePort` + local FS + S3/MinIO via `AMKP_S3_*`; BYTEA default remains)
- **Full PDF engine** — **improved**: default `unpdf` (PDF.js); cheap FlateDecode regex retained via `AMKP_PDF_ENGINE=cheap`. Richer page-vision / VLM still deferred.
- ~~**Real embedding provider**~~ — **done** (`OpenAiEmbeddingProvider` via `AMKP_EMBEDDING_*`; stub remains default). Changing dims requires a vector column migration.
- ~~**In-memory Trace / audit only**~~ — **done** (`PrismaTraceRepository` + `PrismaAuditLog`; memory for tests)
- ~~**In-memory retrieve cache only**~~ — **done** (`RedisTenantRetrieveCache` when `REDIS_URL` set outside test/memory mode)
- ~~**Real OTel exporter**~~ — **done** (`OtelApiTracer` + OTLP HTTP via `startAmkpOtel`)
