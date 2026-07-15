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
| Per-Tenant rate limit | done |
| Ops checklist | `docs/operations.md` |
| PDF FlateDecode inflate | improved (full PDF.js still open) |

## Still open (optional)

- Full PDF.js / layout engine
- Argon2 for low-entropy secrets
- OTel distributed tracing export
- Real VLM page-vision vendor
