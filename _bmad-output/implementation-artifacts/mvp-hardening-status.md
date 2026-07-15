# MVP hardening status (2026-07-15)

## Epics E1–E8

All planned epic stories (T-1.x through T-8.4) have implementation artifacts and commits on `main`.

## Post-MVP hardening shipped

| Item | Status |
| --- | --- |
| Shared Postgres+pgvector index | done |
| Durable traces + audit | done |
| Redis retrieve cache | done |
| Local FS + S3 object storage | done |
| EmbeddingProvider (stub + OpenAI-compatible) | done |
| API key pepper (HMAC) | done |
| `/ready` + adapter `/health` | done |
| Worker `/health` + `/ready` | done |
| Per-Tenant rate limit + response headers | done |
| Admin audit list (+ tenant filter) | done |
| Document delete + index + cache cleanup | done |
| Request IDs + security headers | done |
| Soft request timeout + graceful shutdown | done |
| Large ingest body limit | done |
| OpenTelemetry OTLP export | done |
| Access log (`AMKP_ACCESS_LOG`) | done |
| Document list cursor pagination | done |
| PDF via unpdf (cheap fallback) | done |
| HTTP page-vision vendor | done |
| Multipart ingest upload | done |
| Document status webhooks (+ HMAC + failed) | done |
| Admin list/get Account | done |
| Ops checklist | `docs/operations.md` |
| Redis readiness PING | done |
| Object-storage create orphan compensation | done |
| SDK chunks + admin API keys + requestId | done |
| Ingest `deduped` in OpenAPI/SDK | done |

## Still open (optional)

- Argon2 for API keys (deferred — incompatible with hash-indexed lookup; use peppered HMAC)
- Commercial VLM vendor beyond the HTTP adapter contract
- Richer layout/PDF page-vision pipelines
