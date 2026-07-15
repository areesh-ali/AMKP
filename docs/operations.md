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

When rate limiting is on, retrieve/MCP responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (unix seconds). Over-limit responses also set `Retry-After`.

**Note:** `AMKP_EMBEDDING_DIMS` must match the `vector(64)` column unless you migrate.

## Probes

- `GET /health` — liveness + adapter summary (no secrets)
- `GET /ready` — `SELECT 1` against Postgres
- `GET /metrics` — Prometheus scrape
- Worker: `GET :WORKER_HEALTH_PORT/health` and `/ready` (default `3001`)

## Tracing (OpenTelemetry)

| Mode | Env |
| --- | --- |
| Off (default) | unset |
| Console debug | `AMKP_TRACE_CONSOLE=1` |
| OTLP export | `OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318` (or `AMKP_OTEL=1` → localhost:4318) |
| Service name | `OTEL_SERVICE_NAME` (default `amkp-api`) |

Retrieve spans use `TracerPort` → `@opentelemetry/api` when OTel is enabled.

## PDF parse engine

| Mode | Env |
| --- | --- |
| unpdf / PDF.js (default) | unset |
| Cheap FlateDecode regex | `AMKP_PDF_ENGINE=cheap` |

Default path uses `unpdf` and falls back to the cheap extractor on empty/failed parse.

## Page-vision (tier3 VLM)

Set `AMKP_PAGE_VISION_URL` to an HTTP endpoint that accepts:

```json
{ "filename": "...", "contentType": "...", "contentBase64": "..." }
```

and returns `{ "text": "...", "confidence": 0.8, "spendUsd": 0.02 }`.
Without it, tier3 uses the deterministic stub (still only when Tenant `pageVisionEnabled`).

## Document status webhooks

Set `AMKP_DOCUMENT_WEBHOOK_URL` to receive a POST after a Document reaches `parsed`:

```json
{
  "tenantId": "ten_...",
  "documentId": "doc_...",
  "status": "parsed",
```

Also emitted with `"status": "failed"` when the worker parse job throws (after best-effort Document status update).
  "parseTier": "tier1_text",
  "chunkCount": 3,
  "usedVlm": false,
  "at": "2026-07-15T00:00:00.000Z"
}
```

Delivery failures are logged and do not fail the parse job.

Optional `AMKP_DOCUMENT_WEBHOOK_SECRET` adds header `X-AMKP-Signature: sha256=<hmac>` over the raw JSON body. Receivers can verify with `verifyAmkpWebhookSignature` from `@amkp/adapters-providers`.

## Access logs

Set `AMKP_ACCESS_LOG=1` for one JSON line per HTTP request (`method`, `path`, `status`, `duration_ms`, `request_id`).

## Migrations

```bash
DATABASE_URL=... pnpm --filter @amkp/adapters-postgres prisma:migrate
```

## Worker

Worker and API must share the same `DATABASE_URL`, vector mode, object storage, and embedding provider settings so parse upserts are visible to retrieve.

## Document list pagination

`GET /v1/documents` supports `limit` (default 50, max 500), legacy `offset`, and opaque `cursor` / `nextCursor` for stable DB-level paging (ordered by `sourceKey`, `version`, `id`).

## Multipart ingest

`POST /v1/ingest/upload` accepts `multipart/form-data` with required field `file` and optional `sourceKey` / `filename`. Size capped by `AMKP_MAX_DOCUMENT_BYTES`.
