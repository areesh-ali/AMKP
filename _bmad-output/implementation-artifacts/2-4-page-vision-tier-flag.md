---
story_id: "2.4"
story_key: "2-4-page-vision-tier-flag"
ticket: "T-2.4"
epic: "2"
status: review
created: 2026-07-15
baseline_commit: "3a6850e"
fr: ["FR5"]
cap: ["CAP-2"]
depends_on: ["T-2.3"]
blocks: ["T-2.5"]
---

# Story 2.4: Optional page-vision tier flag

Status: review

## Story

As a Platform Admin,
I want a per-Tenant flag for page-vision tier,
so that VLM spend is opt-in.

## Acceptance Criteria

1. **AC1** — page-vision disabled (default) → scanned deck → no VLM spend — PASS
2. **AC2** — enabling flag allows tier3_page_vision escalation — PASS
3. **AC3** — Admin PATCH `/v1/tenants/:id` updates `pageVisionEnabled` — PASS

## Tasks / Subtasks

- [x] Domain + Prisma `pageVisionEnabled` (default false)
- [x] Admin PATCH tenant settings
- [x] PageVision ledger + Parse Ladder tier3 gated by flag
- [x] ProcessParseJob records usedVlm / vlmSpendUsd
- [x] Unit + integration tests (disabled vs enabled)

## Spec sync

- Parse Ladder: cheap → layout → VLM/page-vision
- PRD: page-vision tier is optional flag per Tenant
- Architecture: VLM not in request thread (worker path)

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- New Tenants default `pageVisionEnabled: false`.
- Tier3 only invoked when cheap tiers yield <20 chars AND flag is true.
- Stub VLM records spend via shared ledger for CI assertions.

### File List

- `packages/domain/src/index.ts`
- `packages/application/src/tenancy/update-tenant-settings.ts`
- `packages/application/src/ingest/process-parse-job.ts`
- `packages/adapters-providers/src/local-parse-ladder.ts`
- `packages/adapters-postgres/prisma/migrations/20260715221500_tenant_page_vision/*`
- `apps/api/src/tenancy/tenancy.controller.ts`
- `apps/api/src/ingest/page-vision.integration.test.ts`
- `packages/openapi/openapi.yaml`
- `_bmad-output/implementation-artifacts/2-4-page-vision-tier-flag.md`

### Change Log

- 2026-07-15: Implemented T-2.4 — status → review
