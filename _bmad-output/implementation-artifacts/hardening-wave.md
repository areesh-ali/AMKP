---
story_key: "hardening-wave-2026-07-15"
status: in_progress
---

# Continuous hardening wave

Running unattended until the user asks to stop.

## Latest on `main` (local)

Continuous hardening continues on tip of `main` (see `git log`). Recent
slices: pagination, OTel, unpdf, page-vision HTTP, multipart ingest,
rate-limit headers, webhooks (+ HMAC + failed), admin account list/get.

## Still optional

- Commercial VLM beyond HTTP contract
- Argon2 (intentionally deferred for high-entropy keyed lookup)
- Richer layout/PDF page-vision pipelines
