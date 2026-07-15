# AMKP operations checklist

## Local / CI

| Mode | Env |
| --- | --- |
| In-process queue + memory index/cache/traces | `AMKP_JOB_QUEUE=memory` (CI default) |
| Shared Postgres index | unset `AMKP_VECTOR_INDEX` (production default) |
| Peppered API keys | `AMKP_API_KEY_PEPPER` (HMAC-SHA256) |

## Production adapters

| Concern | Env | Default |
| --- | --- | --- |
| Vector index | `AMKP_VECTOR_INDEX` | postgres+pgvector |
| Retrieve cache | `REDIS_URL` | Redis when set |
| Document bytes | `AMKP_S3_BUCKET` or `AMKP_OBJECT_STORAGE_DIR` | Postgres BYTEA |
| Embeddings | `AMKP_EMBEDDING_API_KEY` | stub 64-dim hash |
| API key hash | `AMKP_API_KEY_PEPPER` | SHA-256 (no pepper) |
| Ingest MIME allowlist | `AMKP_ALLOWED_CONTENT_TYPES` | all types |
| Ingest size cap | `AMKP_MAX_DOCUMENT_BYTES` | 10 MiB |
| Rate limit | `AMKP_RATE_LIMIT_PER_MINUTE` | off |

**Note:** `AMKP_EMBEDDING_DIMS` must match the `vector(64)` column unless you migrate.

## Probes

- `GET /health` — liveness + adapter summary (no secrets)
- `GET /ready` — `SELECT 1` against Postgres
- `GET /metrics` — Prometheus scrape
- Worker: `GET :WORKER_HEALTH_PORT/health` and `/ready` (default `3001`)

## Migrations

```bash
DATABASE_URL=... pnpm --filter @amkp/adapters-postgres prisma:migrate
```

## Worker

Worker and API must share the same `DATABASE_URL`, vector mode, object storage, and embedding provider settings so parse upserts are visible to retrieve.
