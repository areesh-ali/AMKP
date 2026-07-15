---
story_id: "1.2"
story_key: "1-2-tenant-bound-api-keys"
ticket: "T-1.2"
epic: "1"
status: review
created: 2026-07-15
baseline_commit: "aeffbca0ffc2b95ffeeb8b03c48282e1f960768f"
fr: ["FR2", "FR3"]
cap: ["CAP-1"]
depends_on: ["T-1.1"]
blocks: ["T-1.3", "T-2.1"]
---

# Story 1.2: Tenant-bound API keys

Status: review

## Story

As a Platform Admin,
I want create/revoke/rotate API keys per Tenant,
so that Products authenticate without spoofing Tenant.

## Acceptance Criteria

1. **AC1 — TenantContext from key** — PASS (`GET /v1/me` derives tenant from Bearer key)
2. **AC2 — Body tenant override → 403** — PASS (`POST /v1/me` with mismatched `tenantId`)
3. **AC3 — Revoked key → 401** — PASS (revoke + rotate paths)
4. **AC4 — Admin key lifecycle** — PASS (create/list/revoke/rotate)
5. **AC5 — Hex + OpenAPI** — PASS

## Tasks / Subtasks

- [x] **T1 — Ports + use-cases** (AC: #3, #4)
  - [x] Extend `ApiKeyIssuer` / add `ApiKeyRepository` (findByHash, revoke, list metadata)
  - [x] `CreateApiKey`, `RevokeApiKey`, `RotateApiKey` use-cases
- [x] **T2 — Prisma adapters** (AC: #1, #3, #4)
  - [x] Lookup by `hashApiKey(plaintext)`; reject when `revokedAt` set
  - [x] Reuse existing `ApiKey` model (`revokedAt` already in schema)
- [x] **T3 — TenantContext middleware** (AC: #1–#3)
  - [x] AsyncLocalStorage store for `TenantContext`
  - [x] Bearer Product key → resolve context; missing/invalid/revoked → 401
  - [x] Body `tenantId`/`tenant_id` mismatch → 403
- [x] **T4 — Nest routes** (AC: #1–#5)
  - [x] Admin: `POST/GET /v1/tenants/:tenantId/api-keys`, revoke, rotate (PlatformAdminGuard)
  - [x] Product probe: `GET|POST /v1/me` behind Tenant auth
- [x] **T5 — OpenAPI + tests**
  - [x] Document paths + Tenant Bearer scheme
  - [x] Unit + integration: resolve, override 403, revoke 401, rotate
  - [x] Do **not** build full 1.3 CI suite

## Dev Notes

### Reuse from 1.1
- `hashApiKey` (SHA-256), `PrismaApiKeyIssuer`, `ApiKey.revokedAt`, `PlatformAdminGuard`, error filter, `/v1/...` style

### Anti-patterns avoided
- Body tenant trusted over auth; plaintext on list; Prisma in controllers; full Ingest; full 1.3 suite

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia / bmad-dev-story)

### Debug Log References

- Nest POST `/v1/me` defaulted to 201 → `@HttpCode(200)`

### Completion Notes List

- FR-2/FR-3: TenantContext from API key via `TenantApiKeyGuard` + ALS interceptor; body override 403; revoke/rotate 401.
- Admin lifecycle under `/v1/tenants/:tenantId/api-keys`.
- Probe `/v1/me` stands in until Ingest/Retrieve (T-2.1 / E3).
- Tests: 6 unit + 4 integration + OpenAPI validate — green.
- Full CI auth suite deferred to **T-1.3**.

### File List

- `apps/api/src/common/api-exception.filter.ts`
- `apps/api/src/tenancy/api-keys.controller.ts`
- `apps/api/src/tenancy/me.controller.ts`
- `apps/api/src/tenancy/tenant-api-key.guard.ts`
- `apps/api/src/tenancy/tenant-context.interceptor.ts`
- `apps/api/src/tenancy/tenancy.integration.test.ts`
- `apps/api/src/tenancy/tenancy.module.ts`
- `apps/api/src/tenancy/tenancy.tokens.ts`
- `packages/adapters-postgres/src/client.ts`
- `packages/adapters-postgres/src/index.ts`
- `packages/application/src/index.ts`
- `packages/application/src/tenancy/create-api-key.ts`
- `packages/application/src/tenancy/index.ts`
- `packages/application/src/tenancy/list-api-keys.ts`
- `packages/application/src/tenancy/ports.ts`
- `packages/application/src/tenancy/resolve-tenant-context.ts`
- `packages/application/src/tenancy/revoke-api-key.ts`
- `packages/application/src/tenancy/rotate-api-key.ts`
- `packages/application/src/tenancy/tenant-context.ts`
- `packages/application/src/tenancy/tenancy.test.ts`
- `packages/application/src/tenancy/types.ts`
- `packages/openapi/openapi.yaml`
- `packages/openapi/scripts/validate.mjs`
- `_bmad-output/implementation-artifacts/1-2-tenant-bound-api-keys.md`

### Change Log

- 2026-07-15: Story created and implemented — status → review
