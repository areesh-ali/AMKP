---
story_id: "3.3"
story_key: "3-3-prefer-correctness-threshold"
ticket: "T-3.3"
epic: "3"
status: review
created: 2026-07-15
baseline_commit: "7d4cb1a"
fr: ["FR10"]
cap: ["CAP-3"]
depends_on: ["T-3.2"]
blocks: ["T-3.4"]
---

# Story 3.3: PreferCorrectness mode

Status: review

## Story

As a Product developer,
I want PreferCorrectness,
so that low-coverage queries refuse instead of guessing.

## Acceptance Criteria

1. **AC1** — PreferCorrectness + scores below Tenant threshold → structured `insufficient_evidence` — ✅
2. **AC2** — Threshold is configurable per Tenant (admin PATCH) — ✅ `preferCorrectnessThreshold` (default 0.5)

## Spec sync

- FR10 / UX-DR13: PreferCorrectness insufficient_evidence as first-class structured state
- AD-4: no fabricated chat answers when coverage is weak

## Dev Agent Record

### Change Log

- 2026-07-15: Story created; implementation started
- 2026-07-15: Per-Tenant threshold + Retrieve PreferCorrectness path; OpenAPI + tests

### Files

- `packages/domain/src/index.ts` — `preferCorrectnessThreshold` + default
- `packages/adapters-postgres/prisma/*` — migration + schema
- `packages/application/src/retrieve/retrieve.ts` — threshold gate
- `packages/application/src/tenancy/update-tenant-settings.ts`
- `apps/api/src/retrieve/*` — DTO + DI + integration test
- `packages/openapi/openapi.yaml`

### Tests

- Unit: retrieve PreferCorrectness threshold cases; tenancy settings validation
- Integration: `prefer-correctness.integration.test.ts`
