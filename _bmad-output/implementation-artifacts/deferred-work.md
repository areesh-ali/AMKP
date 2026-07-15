# Deferred work

## Deferred from: code review of T-1.2/1.3/5.1 (2026-07-15)

- ~~**InMemoryVectorIndex as production VECTOR_INDEX**~~ — **done** (`PostgresVectorIndex` + `vector_chunks`; memory retained for tests)
- ~~**API key hash pepper / argon2**~~ — **done** (`AMKP_API_KEY_PEPPER` → HMAC-SHA256; unset keeps SHA-256 for local/dev). Argon2 optional later for low-entropy secrets.
- ~~**Move InMemoryVectorIndex out of adapters-postgres package**~~ — **done** (lives in `@amkp/application`; postgres re-exports for compat)

## Deferred from: code review of T-2.1/T-2.2 (2026-07-15)

- ~~**Worker process uses a separate InMemoryVectorIndex from API**~~ — **done** (both use `PostgresVectorIndex` by default)
- ~~**Object storage for Document bytes**~~ — **done** (`ObjectStoragePort` + `LocalFsObjectStorage` via `AMKP_OBJECT_STORAGE_DIR`; BYTEA default remains; S3 adapter next)
- **Full PDF engine** — Tj/TJ text-layer extractor is intentional cheap tier; richer layout/PDF libs deferred with page-vision (T-2.4)
- **Real embedding provider** — `EmbeddingProvider` port + `StubEmbeddingProvider` wired; swap in OpenAI/Cohere/etc. without changing retrieve
- ~~**In-memory Trace / audit only**~~ — **done** (`PrismaTraceRepository` + `PrismaAuditLog`; memory for tests)
- ~~**In-memory retrieve cache only**~~ — **done** (`RedisTenantRetrieveCache` when `REDIS_URL` set outside test/memory mode)
