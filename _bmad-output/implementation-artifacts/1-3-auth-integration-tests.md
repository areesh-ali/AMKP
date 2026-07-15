---
story_id: "1.3"
story_key: "1-3-auth-integration-tests"
ticket: "T-1.3"
epic: "1"
status: review
created: 2026-07-15
baseline_commit: "ed909df"
fr: ["FR2", "FR3"]
cap: ["CAP-1"]
depends_on: ["T-1.2"]
---

# Story 1.3: Auth integration tests

Status: review

## Story

As a platform engineer,
I want automated auth/isolation auth-path tests,
so that override and revoke regressions fail CI.

## Acceptance Criteria

1. **AC1** — Auth CI suite covers override-reject (403) and is green in CI  
2. **AC2** — Auth CI suite covers revoke → 401 and is green in CI  
3. **AC3** — Suite runs via `pnpm test` / GitHub Actions on Postgres

## Tasks / Subtasks

- [x] Dedicated `apps/api/src/auth/auth-paths.ci.test.ts` (override + revoke + cross-tenant key)
- [x] `.github/workflows/ci.yml` with Postgres service + migrate + auth tests
- [x] Root `pnpm test` / `pnpm test:auth` wired to real suites
- [x] Clean-architecture refactor: adapters split by aggregate; Nest PersistenceModule injects **ports** not Prisma classes

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- Port tokens (`ACCOUNT_REPOSITORY`, etc.) live in `@amkp/application`; Nest composition root binds Prisma adapters.
- Adapters-postgres split: `prisma`, `account|tenant|api-key` repositories, `health`.
- CI: Node 24.18 + pgvector:pg16 on 5433 + `prisma migrate deploy` + auth suite.

### File List

- `.github/workflows/ci.yml`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth-paths.ci.test.ts`
- `apps/api/src/infrastructure/persistence.module.ts`
- `apps/api/src/infrastructure/prisma.module.ts`
- `apps/api/src/tenancy/tenancy.module.ts`
- `package.json`
- `packages/adapters-postgres/src/*` (split files; removed monolithic `client.ts`)
- `packages/application/src/tenancy/tokens.ts`
- `_bmad-output/implementation-artifacts/1-3-auth-integration-tests.md`

### Change Log

- 2026-07-15: Auth CI suite + hex cleanup — status → review
