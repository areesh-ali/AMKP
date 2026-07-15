# Changelog

## Unreleased (local `main`, ahead of origin)

### Post-epic hardening

- Shared **Postgres + pgvector** index across API and worker
- Durable **traces** + **audit** in Postgres; Redis **retrieve cache**
- **Local FS** and **S3/MinIO** object storage for Document bytes
- **OpenAI-compatible** embeddings behind `AMKP_EMBEDDING_*`
- API key **HMAC pepper**, `/ready`, worker health probes
- Per-Tenant **rate limits**, **request IDs**, security headers, soft timeouts
- **Document delete** with vector + cache cleanup
- Admin **`GET /v1/audit`** and **`AmkpAdminClient`**
- Document **delete**, **reparse**, idempotent ingest, SDK `waitForDocument`
- Document list **DB cursor pagination** (`limit`/`offset`/`cursor`/`nextCursor`)
- **OpenTelemetry** OTLP HTTP exporter (`OTEL_EXPORTER_OTLP_ENDPOINT` / `AMKP_OTEL`)
- Admin audit **tenantId** filter, SDK `updateTenant`, optional `AMKP_ACCESS_LOG`
- PDF parse via **unpdf** (PDF.js) by default; `AMKP_PDF_ENGINE=cheap` fallback
- HTTP **page-vision** vendor via `AMKP_PAGE_VISION_URL` (tier3)
- Multipart **`POST /v1/ingest/upload`** (field `file`)
- Document **status webhook** (`AMKP_DOCUMENT_WEBHOOK_URL`, optional HMAC secret)
- Admin **`GET /v1/accounts`** list + **`GET /v1/accounts/:id`**
- Tenant **`GET /v1/documents/:id/content`** download
- Tenant **`GET /v1/documents/versions?sourceKey=`** version history
- Enriched **`/health` adapters** (pdf/embeddings/webhook/otel)
- Admin **`GET /v1/tenants`** (optional `accountId`)
- Document list **`?status=`** filter
- Optional **HSTS** (`AMKP_HSTS=1`) + CORP header
- Ops guide: `docs/operations.md`

### Epics E1–E8

MVP epic stories T-1.0 through T-8.4 implemented (see `_bmad-output/implementation-artifacts/`).
