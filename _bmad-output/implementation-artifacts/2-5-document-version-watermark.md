---
story_id: "2.5"
story_key: "2-5-document-version-watermark"
ticket: "T-2.5"
epic: "2"
status: review
created: 2026-07-15
baseline_commit: "830ae47"
fr: ["FR7"]
cap: ["CAP-2"]
depends_on: ["T-2.4"]
blocks: ["T-3.1"]
---

# Story 2.5: Document version watermark

Status: review

## Story

As a Product engineer,
I want re-ingest to create a new version preferred on Retrieve,
so that stale answers can be fixed (UJ-3 / SPEC stale-cite failure mode).

## Acceptance Criteria

1. **AC1** — Re-ingest of same source creates a new version — PASS
2. **AC2** — Retrieve prefers latest version by default — PASS
3. **AC3** — Evidence exposes `documentVersionId` — PASS

## Spec sync

- FR-7: Document versioning / freshness watermark
- SPEC: Chunks carry Document version/hash
- Failure-mode: Stale cite → prefer latest

## Tasks / Subtasks

- [x] `sourceKey` / `version` / `contentHash` on Document
- [x] Re-ingest increments version per tenant+sourceKey
- [x] Chunks + index carry `documentVersionId` + version watermark
- [x] Retrieve prefer-latest filter
- [x] Unit + API integration tests

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- Each ingest of the same `sourceKey` creates a new Document row with version N+1 and SHA-256 contentHash.
- Indexed chunks stamp sourceKey/version/documentVersionId; Retrieve drops older versions by default.
- `documentVersionId` equals Document id for MVP (each row is a version).

### File List

- `packages/domain/src/index.ts`
- `packages/application/src/ingest/ingest-document.ts`
- `packages/application/src/retrieve/retrieve.ts`
- `packages/adapters-postgres/prisma/migrations/20260715223000_document_versions/*`
- `apps/api/src/ingest/version-watermark.integration.test.ts`
- `_bmad-output/implementation-artifacts/2-5-document-version-watermark.md`

### Change Log

- 2026-07-15: Implemented T-2.5 — status → review
