---
story_id: "2.2"
story_key: "2-2-parse-ladder-tiers-1-2"
ticket: "T-2.2"
epic: "2"
status: review
created: 2026-07-15
baseline_commit: "5c6c759"
fr: ["FR5"]
cap: ["CAP-2"]
depends_on: ["T-2.1"]
blocks: ["T-2.3", "T-2.4"]
---

# Story 2.2: Parse Ladder tiers 1–2

Status: review

## Story

As a platform engineer,
I want cheap and layout-aware parse tiers,
so that text PDFs index without VLM cost.

## Acceptance Criteria

1. **AC1** — Text-layer PDF parse completes on cheap tier (tier1) without VLM — PASS
2. **AC2** — Chunks record the parse tier used — PASS
3. **AC3** — Tier2 layout path available when tier1 yield is insufficient (still no VLM) — PASS

## Tasks / Subtasks

- [x] Domain Chunk + parseTier; Document status `parsed`
- [x] Document content load + ChunkRepository
- [x] ParseLadderUseCase (tier1 → tier2, never VLM)
- [x] Text-layer PDF / plain-text extractors
- [x] Worker parse consumer indexes Chunks
- [x] Unit + integration tests with text-layer PDF fixture
- [x] GET `/v1/documents/:id/chunks` + OpenAPI

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- `LocalParseLadder` extracts text-layer PDF Tj/TJ strings; `usedVlm` always false.
- Tier1 preferred when ≥20 chars; else tier2 layout segmentation; VLM deferred to T-2.4.
- Chunks persisted with `parseTier` + `parseConfidence`; upserted into VectorIndexPort.
- Worker `parse` consumer runs `ProcessParseJobUseCase`.

### File List

- `packages/domain/src/index.ts`
- `packages/application/src/ingest/parse-ports.ts`
- `packages/application/src/ingest/process-parse-job.ts`
- `packages/application/src/ingest/parse.test.ts`
- `packages/adapters-providers/src/local-parse-ladder.ts`
- `packages/adapters-postgres/prisma/migrations/20260715214500_chunks/*`
- `packages/adapters-postgres/src/chunk.repository.ts`
- `apps/api/src/ingest/*`
- `apps/worker/src/main.ts`
- `packages/openapi/openapi.yaml`
- `_bmad-output/implementation-artifacts/2-2-parse-ladder-tiers-1-2.md`

### Change Log

- 2026-07-15: Implemented T-2.2 — status → review
