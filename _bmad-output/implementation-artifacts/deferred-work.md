# Deferred work

## Deferred from: code review of T-1.2/1.3/5.1 (2026-07-15)

- ~~**InMemoryVectorIndex as production VECTOR_INDEX**~~ — **done** (`PostgresVectorIndex` + `vector_chunks`; memory retained for tests)
- **API key hash pepper / argon2** — SHA-256 of high-entropy keys is acceptable for MVP; revisit with secrets rotation story
- **Move InMemoryVectorIndex out of adapters-postgres package** — package rename/split optional; memory stub remains for tests

## Deferred from: code review of T-2.1/T-2.2 (2026-07-15)

- ~~**Worker process uses a separate InMemoryVectorIndex from API**~~ — **done** (both use `PostgresVectorIndex` by default)
- **Object storage for Document bytes** — BYTEA in Postgres is MVP; move to S3-compatible store before large corpora
- **Full PDF engine** — Tj/TJ text-layer extractor is intentional cheap tier; richer layout/PDF libs deferred with page-vision (T-2.4)
- **Real embedding provider** — stub 64-dim hash embedding until provider adapter; dims/schema stay swappable
