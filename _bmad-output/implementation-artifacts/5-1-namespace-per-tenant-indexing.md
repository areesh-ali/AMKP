---
story_id: "5.1"
story_key: "5-1-namespace-per-tenant-indexing"
ticket: "T-5.1"
epic: "5"
status: review
created: 2026-07-15
baseline_commit: "d5471b2"
fr: ["FR16"]
cap: ["CAP-5"]
depends_on: ["T-1.2"]
---

# Story 5.1: Namespace-per-Tenant indexing

Status: review

## Story

As a security liaison,
I want dedicated vector namespaces per Tenant,
so that missing Tenant context fails closed.

## Acceptance Criteria

1. **AC1** — Without auth/TenantContext, retrieve fails closed — PASS (401 without Bearer)
2. **AC2** — Dedicated `vectorNamespace` per Tenant; cross-Tenant retrieve never returns other content — PASS
3. **AC3** — Hexagonal RetrieveUseCase + VectorIndexPort; AuthModule shared — PASS

## Tasks / Subtasks

- [x] Domain `vectorNamespace` + `tenantVectorNamespace()`
- [x] Prisma migration with backfill
- [x] `RetrieveUseCase` fail-closed + defense-in-depth filter
- [x] `InMemoryVectorIndex` adapter; `POST /v1/retrieve`
- [x] `AuthModule` extracted for shared Tenant guards
- [x] Unit + isolation integration tests

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia)

### Completion Notes List

- Namespace = `ns_{tenantId}` stored uniquely on Tenant.
- Retrieve refuses null context; index search is namespace-scoped with post-filter.
- AuthModule exports TenantApiKeyGuard for Tenancy + Retrieve modules.

### File List

- `packages/domain/src/index.ts`
- `packages/application/src/retrieve/*`
- `packages/adapters-postgres/prisma/migrations/20260715161044_tenant_vector_namespace/*`
- `packages/adapters-postgres/src/tenant.repository.ts`
- `packages/adapters-postgres/src/in-memory-vector-index.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/retrieve/*`
- `apps/api/src/infrastructure/persistence.module.ts`
- `packages/openapi/openapi.yaml`
- `_bmad-output/implementation-artifacts/5-1-namespace-per-tenant-indexing.md`

### Change Log

- 2026-07-15: Implemented T-5.1 — status → review
- 2026-07-15: Code review patches applied (ALS interceptor, namespace from auth, empty-query reject, rotate-revoked reject, override dual-field, auth retrieve coverage)

### Review Findings

- [x] [Review][Patch] Fix TenantContext ALS interceptor subscribe-inside-run
- [x] [Review][Patch] Derive retrieve namespace from auth tenantId only
- [x] [Review][Patch] Reject empty retrieve query
- [x] [Review][Patch] Reject rotate of already-revoked key
- [x] [Review][Patch] Check both tenantId and tenant_id for override
- [x] [Review][Patch] Auth CI covers retrieve override + revoke
- [x] [Review][Patch] Unique api_keys.key_hash + findActive filters revoked
- [x] [Review][Patch] Distinguish invalid vs revoked; ValidationError → 400; hide 500 details
- [x] [Review][Patch] timingSafeEqual for admin token
- [x] [Review][Defer] InMemoryVectorIndex production binding — deferred, MVP until pgvector
- [x] [Review][Defer] OpenAPI EvidenceEnvelope schema — deferred to T-8.1
- [x] [Review][Defer] Hash pepper — deferred
- [x] [Review][Defer] Move in-memory index package — deferred
