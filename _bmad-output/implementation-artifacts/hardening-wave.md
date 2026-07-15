---
story_key: "hardening-wave-2026-07-15"
status: in_progress
---

# Continuous hardening wave

Running unattended until the user asks to stop.

## Latest on `main` (local, not pushed)

~46 commits ahead of `origin/main` covering:

1. E8 completion (MCP docs + reference app)
2. Postgres+pgvector shared index
3. Durable traces/audit + Redis cache
4. Object storage (FS + S3)
5. Embeddings (stub + OpenAI-compatible)
6. Security/ops (pepper, rate limits, probes, timeouts)
7. Document delete/reparse/pagination/idempotent ingest
8. SDK admin + waitForDocument

## Next candidates

- Cursor-based document pagination (DB-level)
- Real OTel exporter
- PDF.js layout engine
- Admin tenant get-by-id endpoint
