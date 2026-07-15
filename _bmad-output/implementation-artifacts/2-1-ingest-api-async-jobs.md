---
story_id: "2.1"
story_key: "2-1-ingest-api-async-jobs"
ticket: "T-2.1"
epic: "2"
status: review
created: 2026-07-15
baseline_commit: "6ec319f"
fr: ["FR4", "FR24"]
cap: ["CAP-2"]
depends_on: ["T-1.2", "T-5.1"]
blocks: ["T-2.2"]
---

# Story 2.1: Ingest API + async jobs

Status: review

## Story

As a Product developer,
I want to upload a Document and get Document + job IDs,
so that ingest does not block my request thread.

## Acceptance Criteria

1. **AC1** — Tenant-scoped key + upload → response includes Document ID and async job ID — PASS
2. **AC2** — Document is not listable from another Tenant — PASS
3. **AC3** — Work is enqueued on BullMQ `ingest` / `parse` queues (AD-5) — PASS (API enqueues ingest; worker ProcessIngestJob enqueues parse; InMemoryJobQueue in tests / BullMQ in prod)

## Tasks / Subtasks

- [x] Domain `Document` + application Ingest use-case / ports
- [x] Prisma `documents` table + repository (tenant-scoped)
- [x] `JobQueuePort` + BullMQ adapter (`ingest`, `parse`)
- [x] `POST /v1/ingest` + `GET /v1/documents` (tenant-scoped)
- [x] Worker consumers: ingest → enqueue parse (stub)
- [x] Unit + isolation integration tests
- [x] OpenAPI paths for ingest/list

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- Sync edge returns 202 with `documentId` + `jobId`; content stored as BYTEA (object store later).
- Hexagonal: DocumentRepository + JobQueuePort; Nest composition root picks InMemory (test) or BullMQ (REDIS_URL).
- Worker consumes `ingest`, marks accepted, enqueues `parse` (stub ack until T-2.2).
- Cross-tenant list/get returns empty / 404 DOCUMENT_NOT_FOUND.

### File List

- `packages/domain/src/index.ts`
- `packages/application/src/ingest/*`
- `packages/adapters-postgres/prisma/schema.prisma`
- `packages/adapters-postgres/prisma/migrations/20260715213000_documents/*`
- `packages/adapters-postgres/src/document.repository.ts`
- `packages/adapters-redis/src/*`
- `apps/api/src/ingest/*`
- `apps/api/src/infrastructure/persistence.module.ts`
- `apps/worker/src/main.ts`
- `packages/openapi/openapi.yaml`
- `_bmad-output/implementation-artifacts/2-1-ingest-api-async-jobs.md`

### Change Log

- 2026-07-15: Implemented T-2.1 — status → review
