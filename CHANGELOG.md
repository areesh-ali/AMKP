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
- Ops guide: `docs/operations.md`

### Epics E1–E8

MVP epic stories T-1.0 through T-8.4 implemented (see `_bmad-output/implementation-artifacts/`).
