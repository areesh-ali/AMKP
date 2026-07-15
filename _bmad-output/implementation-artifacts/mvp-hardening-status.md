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
| Per-Tenant rate limit | done |
| Admin audit list | done |
| Document delete + index + cache cleanup | done |
| Request IDs + security headers | done |
| Soft request timeout + graceful shutdown | done |
| Large ingest body limit | done |
| TracerPort stub | done |
| Ops checklist | `docs/operations.md` |
| PDF FlateDecode inflate | improved (full PDF.js still open) |
| Document list cursor pagination | done |
| OpenTelemetry OTLP export | done |
| Access log (`AMKP_ACCESS_LOG`) | done |
| Audit list tenant filter | done |

## Still open (optional)

- Full PDF.js / layout engine — **improved** via `unpdf` default (`AMKP_PDF_ENGINE=cheap` for legacy regex path)
- Argon2 for API keys (deferred — incompatible with hash-indexed lookup; use peppered HMAC)
- Real VLM page-vision vendor
