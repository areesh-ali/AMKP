---
story_id: "8.1"
story_key: "8-1-versioned-http-openapi"
ticket: "T-8.1"
epic: "8"
status: review
created: 2026-07-15
baseline_commit: "4da0288"
fr: ["FR24"]
cap: ["CAP-8"]
depends_on: ["T-3.2"]
blocks: ["T-8.2"]
---

# Story 8.1: Versioned HTTP + OpenAPI

Status: review

## Acceptance Criteria

1. **AC1** — OpenAPI documents Ingest/Retrieve (and Tenancy) under `/v1` — ✅ `packages/openapi/openapi.yaml`
2. **AC2** — Breaking changes require version bump — ✅ policy note below

## Versioning policy

- Public HTTP paths are versioned (`/v1/...`).
- Breaking OpenAPI/schema changes require a new major path (`/v2`) or coordinated `schemaVersion` bump on EvidenceEnvelope.
- Additive optional fields are non-breaking within `/v1`.

## Dev Agent Record

- Contract already published in T-3.2; this story locks the versioning policy and marks E8 OpenAPI complete for MVP surface.
