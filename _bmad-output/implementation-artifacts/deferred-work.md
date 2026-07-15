# Deferred work

## Deferred from: code review of T-1.2/1.3/5.1 (2026-07-15)

- **InMemoryVectorIndex as production VECTOR_INDEX** — intentional MVP stub until pgvector retrieve adapter (E3); keep documented, replace in T-3.x
- **OpenAPI EvidenceEnvelope schema on `/v1/retrieve` 200** — polish in T-8.1 OpenAPI story
- **API key hash pepper / argon2** — SHA-256 of high-entropy keys is acceptable for MVP; revisit with secrets rotation story
- **Move InMemoryVectorIndex out of adapters-postgres package** — package rename/split when real pgvector adapter lands

## Deferred from: code review of T-2.1/T-2.2 (2026-07-15)

- **Worker process uses a separate InMemoryVectorIndex from API** — acceptable until shared pgvector/SoR index (T-3.x); API tests share Nest-bound index via ProcessParseJobUseCase
- **Object storage for Document bytes** — BYTEA in Postgres is MVP; move to S3-compatible store before large corpora
- **Full PDF engine** — Tj/TJ text-layer extractor is intentional cheap tier; richer layout/PDF libs deferred with page-vision (T-2.4)
