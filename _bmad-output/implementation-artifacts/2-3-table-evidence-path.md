---
story_id: "2.3"
story_key: "2-3-table-evidence-path"
ticket: "T-2.3"
epic: "2"
status: review
created: 2026-07-15
baseline_commit: "32fcf75"
fr: ["FR6"]
cap: ["CAP-2"]
depends_on: ["T-2.2"]
blocks: ["T-2.4", "T-3.1"]
---

# Story 2.3: TableEvidence path

Status: review

## Story

As a Product developer,
I want table structure preserved as TableEvidence,
so that table/chart questions can be answered faithfully.

## Acceptance Criteria (SPEC CAP-2 / FR-6)

1. **AC1** — Document with recoverable tables → Retrieve can return TableEvidence with headers/cells — PASS
2. **AC2** — `parseConfidence` ∈ [0,1] present on Evidence / Chunks — PASS
3. **AC3** — Gold fixture (markdown table) round-trips ingest → parse → retrieve — PASS

## Tasks / Subtasks

- [x] Persist optional TableEvidence on Chunks (`table_json`)
- [x] Detect markdown/CSV tables during Parse Ladder
- [x] IndexedChunk + Retrieve map `table` + `parseConfidence`
- [x] Clamp parseConfidence to [0,1]
- [x] Unit + integration gold fixture tests
- [x] OpenAPI ChunkSummary + TableEvidence schemas

## Spec sync notes

- Glossary: TableEvidence = Evidence preserving table structure
- SPEC success: table gold fixtures return TableEvidence with structure
- Failure-mode: Chart miss → Parse Ladder + TableEvidence (page-vision still T-2.4)

## Code review (T-2.1/T-2.2) patches applied with this story

- [x] [Review][Patch] Generic MissingTenantContextError message (not Retrieve-only)
- [x] [Review][Patch] DocumentNotFoundError from Prisma updateStatus
- [x] [Review][Patch] Preserve table structure through parse (no whitespace collapse of MD tables)
- [x] [Review][Patch] Retrieve surfaces table + parseConfidence/parseTier
- [x] [Review][Defer] Worker vs API separate InMemoryVectorIndex — deferred to T-3.x / pgvector

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- Markdown `|...|` tables and simple CSV become Chunks with `table` + flattened searchable content.
- Retrieve EvidenceItem includes `table` and clamped `parseConfidence`.
- Gold fixture covers application unit + API integration paths.

### File List

- `packages/application/src/ingest/table-evidence.ts`
- `packages/application/src/ingest/process-parse-job.ts`
- `packages/application/src/retrieve/retrieve.ts`
- `packages/adapters-postgres/prisma/migrations/20260715220000_chunk_table_json/*`
- `packages/adapters-postgres/src/chunk.repository.ts`
- `apps/api/src/ingest/table-evidence.integration.test.ts`
- `packages/openapi/openapi.yaml`
- `_bmad-output/implementation-artifacts/2-3-table-evidence-path.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`

### Change Log

- 2026-07-15: Implemented T-2.3 + review patches — status → review
