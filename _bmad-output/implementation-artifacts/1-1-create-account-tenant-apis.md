---
story_id: "1.1"
story_key: "1-1-create-account-tenant-apis"
ticket: "T-1.1"
epic: "1"
status: review
created: 2026-07-15
baseline_commit: "168c912035f3b713982a9a8bcfaec2ec2b3ed79a"
fr: ["FR1"]
cap: ["CAP-1"]
depends_on: ["T-1.0"]
blocks: ["T-1.2", "T-1.3", "T-2.1", "T-5.1"]
---

# Story 1.1: Create Account & Tenant APIs

Status: review

<!-- Validation optional. Run validate-create-story before DS if desired. -->

## Story

As a Platform Admin,
I want to create an Account and Tenants with unique IDs,
so that each Product has an isolation boundary.

## Acceptance Criteria

1. **AC1 — Create Account**  
   **Given** a valid Platform Admin credential  
   **When** I `POST /v1/accounts` with a display name  
   **Then** response is `201` with a unique `accountId` (ULID/UUID v7 string; optional consistent prefix e.g. `acc_`)  
   **And** the Account is persisted in Postgres

2. **AC2 — Create Tenant under Account**  
   **Given** a valid Platform Admin credential and an existing Account  
   **When** I `POST /v1/accounts/{accountId}/tenants` with a display name (e.g. `support`, `docs` per UJ-1)  
   **Then** response is `201` with unique `tenantId` (prefer `ten_` + ULID/UUID v7)  
   **And** response includes a **one-time plaintext API key** scoped **only** to that Tenant  
   **And** the key secret is stored **hashed** (never log plaintext; never return again on list)  
   **And** new Tenant defaults to **single-pass only** (`agenticEnabled: false` / equivalent) per AD-8

3. **AC3 — List Tenants is Account-scoped**  
   **Given** Accounts A and B each have ≥1 Tenant  
   **When** I `GET /v1/accounts/{accountAId}/tenants` as Platform Admin  
   **Then** response lists only Account A’s Tenants  
   **And** Account B’s Tenants never appear  
   **And** listing a non-existent Account returns `404` with standard error shape

4. **AC4 — Admin auth gate**  
   **Given** a missing/invalid Platform Admin credential  
   **When** I call any Account/Tenant create or list endpoint  
   **Then** response is `401` with `{ "error": { "code", "message", "request_id" } }`  
   **And** no stack traces leak to clients

5. **AC5 — OpenAPI**  
   **Given** the three endpoints above  
   **When** OpenAPI artifacts under `packages/openapi` are built/exported  
   **Then** create Account, create Tenant, and list Tenants are documented (paths, request/response, auth, errors)

6. **AC6 — Hexagonal placement**  
   **Given** Architecture AD-1  
   **When** implementation lands  
   **Then** Nest controllers in `apps/api` call application use-cases only (no Prisma/SQL in controllers)  
   **And** ports live in `@amkp/application` (tenancy area)  
   **And** Prisma persistence lives in `@amkp/adapters-postgres`  
   **And** domain types for Account/Tenant live in `@amkp/domain`  
   **And** `GET /health` still returns `{ ok: true, service: "api" }`

## Tasks / Subtasks

- [x] **T1 — Domain types** (AC: #2, #6)
  - [x] Add `AccountId` type; keep `TenantId` (already exists)
  - [x] Add `Account` / `Tenant` entity types (id, name, timestamps, tenant defaults including agentic-off)
  - [x] Do **not** change `EvidenceEnvelope` / related retrieve types

- [x] **T2 — Application tenancy ports + use-cases** (AC: #1–#4, #6)
  - [x] Add ports: `AccountRepository` / `TenantRepository` (or single `TenancyRepository`) + `ApiKeyIssuer` (hash+persist + return plaintext once)
  - [x] Use-cases: `CreateAccount`, `CreateTenant`, `ListTenantsByAccount`
  - [x] CreateTenant must: validate Account exists → create Tenant → issue Tenant-scoped key → return `{ tenant, apiKey }` (plaintext once)
  - [x] ListTenants filters strictly by `accountId` (fail closed — never global list)
  - [x] Prefer splitting under `packages/application/src/tenancy/` and re-export from `index.ts` (AD-1 capability map)

- [x] **T3 — Prisma in adapters-postgres** (AC: #1–#3, #6)
  - [x] Add Prisma **7.8.0** + `@prisma/adapter-pg` + `pg` to `@amkp/adapters-postgres` (Prisma 7 requires driver adapter)
  - [x] `schema.prisma`: `Account`, `Tenant`, `ApiKey` models; FK Tenant→Account; ApiKey→Tenant; unique IDs
  - [x] Generator: `provider = "prisma-client"`, explicit `output`, `moduleFormat = "cjs"` (Nest apps are CommonJS)
  - [x] Implement repository adapters; store API key **hash** only (e.g. sha256/bcrypt/argon2 — pick one and document in Dev Agent Record)
  - [x] Migration runnable against compose Postgres (`DATABASE_URL` from `.env.example`)
  - [x] Keep `PostgresHealthAdapter` export; optionally make health check hit DB `$queryRaw` SELECT 1 (nice-to-have, not AC)

- [x] **T4 — Nest HTTP + Platform Admin auth** (AC: #1–#4, #6)
  - [x] Wire `@amkp/adapters-postgres` into `@amkp/api` (workspace dep)
  - [x] `TenancyModule` + controllers for the three routes under `/v1/...`
  - [x] Platform Admin guard: require `Authorization: Bearer <PLATFORM_ADMIN_TOKEN>` matching env (MVP bootstrap — full key middleware is **T-1.2**)
  - [x] Global/request `request_id` on error responses; UTC ISO-8601 timestamps in JSON
  - [x] Preserve `HealthController` / `GET /health`
  - [x] Update `.env.example` with `PLATFORM_ADMIN_TOKEN=`

- [x] **T5 — OpenAPI export** (AC: #5)
  - [x] `packages/openapi` currently has **no source files** (build is echo stub) — **NEW** `openapi.yaml` (or `.json`) documenting the three endpoints
  - [x] Replace package `build` script so it validates/exports the committed spec (do not leave echo-only)
  - [x] Auth scheme: HTTP Bearer (Platform Admin token) on these routes

- [x] **T6 — Tests (red → green)** (AC: #1–#4)
  - [x] Add **vitest** as the first real test runner for touched packages (replace echo `"test: stub"` scripts you change); Nest `@nestjs/testing` OK for controller tests
  - [x] Unit: CreateAccount / CreateTenant / ListTenants use-cases (in-memory fake repos)
  - [x] Integration: against Postgres (compose or testcontainer) — create A+B Accounts, Tenants, assert list isolation; assert 401 without admin token; assert key returned once and hash stored
  - [x] Regression: `GET /health` still works
  - [x] Do **not** implement full revoke/override suite (that is **T-1.3**)

- [x] **T7 — Workspace wiring** (AC: #6)
  - [x] Ensure `pnpm --filter @amkp/domain build` → application → adapters-postgres → api typecheck/build
  - [x] Document migrate command in Completion Notes (e.g. prisma migrate from adapters-postgres)

## Dev Notes

### Scope boundaries (DO / DO NOT)

| DO (this story) | DO NOT (later stories) |
| --- | --- |
| Create Account, Create Tenant, List Tenants | API key rotate / revoke / list keys (**T-1.2**) |
| Issue **initial** Tenant-scoped key on create | `TenantContext` middleware for Retrieve/Ingest (**T-1.2**) |
| Platform Admin env-token gate | Body tenant override → 403 tests (**T-1.2 / T-1.3**) |
| Prisma Account/Tenant/ApiKey SoR | Document/Chunk/Job tables (**E2**) |
| OpenAPI for these three ops | Full Ingest/Retrieve OpenAPI polish (**T-8.1**) |
| Preserve EvidenceEnvelope + health | Worker/BullMQ/MCP/Redis cache (**E2+ / E5 / E8**) |

### Binding architecture

- **AD-1:** Controllers → use-cases/ports; Nest module area = `tenancy`. [Source: `ARCHITECTURE-SPINE.md` AD-1, Capability map CAP-1]
- **AD-2:** Tenant identity from auth only — do not design create/list to accept spoofable tenant scoping from body. Full ALS middleware is T-1.2. [Source: AD-2]
- **AD-3:** Tenant is hard isolation unit; creating Tenant establishes the boundary (namespace enforcement = T-5.1). [Source: AD-3]
- **AD-8:** New Tenants default single-pass / agentic off. [Source: AD-8]
- **AD-9:** Accounts + Tenants in PostgreSQL via Prisma. [Source: AD-9]
- **AD-10:** HTTP in `apps/api` only. [Source: AD-10]

### Consistency conventions (must follow)

| Concern | Rule |
| --- | --- |
| Auth header | `Authorization: Bearer …` |
| IDs | ULID or UUID v7 strings; prefix consistently per type (`ten_` required for Tenant; `acc_` recommended for Account) |
| Errors | `{ "error": { "code", "message", "request_id" } }` — no stacks |
| Time | UTC ISO-8601 |
| Logging | Structured JSON; **never** log API keys or raw Document bodies |
| Config | 12-factor env; secrets only in env |

[Source: `ARCHITECTURE-SPINE.md` Consistency Conventions]

### Suggested API contract (lock in OpenAPI)

```http
POST /v1/accounts
Authorization: Bearer <PLATFORM_ADMIN_TOKEN>
Content-Type: application/json
{ "name": "Acme Corp" }

→ 201 { "accountId": "acc_…", "name": "Acme Corp", "createdAt": "…" }

POST /v1/accounts/{accountId}/tenants
Authorization: Bearer <PLATFORM_ADMIN_TOKEN>
{ "name": "support" }

→ 201 {
  "tenantId": "ten_…",
  "accountId": "acc_…",
  "name": "support",
  "agenticEnabled": false,
  "apiKey": "amkp_…",   // plaintext ONCE
  "createdAt": "…"
}

GET /v1/accounts/{accountId}/tenants
Authorization: Bearer <PLATFORM_ADMIN_TOKEN>

→ 200 { "items": [ { "tenantId", "accountId", "name", "agenticEnabled", "createdAt" } ] }
// NEVER include apiKey plaintext in list
```

Paths above are the **recommended lock**; if you must deviate, update OpenAPI + this story’s AC path strings together. Do not invent `/accounts` without version prefix — FR-24 expects versioned HTTP.

### Prisma 7.8 (critical — avoid Prisma 5 patterns)

Prisma 7 is **Rust-free / adapter-based**. Wrong setup = green types, red runtime.

1. Depend on `@prisma/client@7.8.0`, `prisma@7.8.0` (dev), `@prisma/adapter-pg`, `pg`
2. Generator uses `provider = "prisma-client"` + explicit `output` + `moduleFormat = "cjs"` for Nest CommonJS
3. Construct client with `PrismaPg` adapter + `DATABASE_URL` — **not** bare `new PrismaClient()` without adapter
4. Keep schema/migrations under `packages/adapters-postgres` (SoR adapter owns persistence)

[Source: NestJS Prisma recipe + Prisma NestJS guide; stack pin `stack.md`]

### Existing code — UPDATE vs KEEP

| Path | Action | Notes |
| --- | --- | --- |
| `packages/domain/src/index.ts` | **UPDATE** | Add Account/Tenant types; **preserve** `EvidenceEnvelope` |
| `packages/application/src/index.ts` | **UPDATE** | Add tenancy ports/use-cases; **preserve** `TenantContext`, `RetrievePort`, `HealthUseCase` |
| `packages/adapters-postgres/src/index.ts` | **UPDATE** | Real Prisma repos; stub comment already points to T-1.1 |
| `apps/api/src/app.module.ts` | **UPDATE** | Register TenancyModule |
| `apps/api/src/health.controller.ts` | **KEEP** | Do not break `/health` |
| `apps/api/src/main.ts` | **UPDATE** if needed | ValidationPipe / global filters OK |
| `packages/openapi/*` | **UPDATE** | Real Account/Tenant ops |
| `.env.example` | **UPDATE** | `PLATFORM_ADMIN_TOKEN` |
| `apps/worker/**` | **KEEP** | Out of scope |
| `packages/adapters-redis/**` | **KEEP** | Queue names frozen |
| `packages/sdk-js/**` | **KEEP** | SDK Account helpers = T-8.2 |

### Anti-patterns (will fail review)

1. Prisma queries inside Nest controllers  
2. Returning API key plaintext on list or subsequent GETs  
3. Logging Bearer tokens / apiKey  
4. Soft tenancy (shared table without Account FK / global Tenant list)  
5. Trusting `accountId`/`tenantId` from body to authorize admin ops without admin Bearer  
6. Changing `EvidenceEnvelope` shape  
7. Implementing revoke/rotate/middleware “while we’re here” (scope creep → T-1.2)  
8. Installing Prisma 4/5 style client without `@prisma/adapter-pg`  
9. Adding Express routers outside Nest modules  

### Stack pins

| Concern | Version |
| --- | --- |
| Node | ≥24.18.0 |
| NestJS | 11.1.28 (already in api) |
| Prisma | **7.8.0** |
| Postgres | 16.x + pgvector image (compose) |
| pnpm | 9.15.9 |

**Known drift:** workspace TypeScript is `5.8.3` while `stack.md` lists `7.0.2`. **Do not** upgrade TS in this story unless build is blocked — note drift in Completion Notes only.

### Previous work / git intelligence

- **T-1.0** bootstrap landed in initial commit `f2368ce` (monorepo, health, domain EvidenceEnvelope, application stubs, compose). No prior story markdown file.
- Recent commits are README-only — no API patterns beyond health.
- Application already shows the DI pattern to copy: `HealthUseCase(private readonly health: HealthPort)`.
- Api currently does **not** wire `HealthUseCase` — health is inline. For tenancy, **do** wire use-cases properly (establish the pattern).

### Testing standards

- First real tests in repo — replace echo `"test: stub"` for packages you change.
- Prefer: unit tests in `packages/application`; integration tests that need DB in `packages/adapters-postgres` or `apps/api`.
- Minimum green bar for story complete: AC1–AC4 covered by automated tests; AC5 by committed OpenAPI artifact; AC6 by structure review + health smoke.
- Isolation Leak Tests / revoke CI = **T-1.3 / T-5.x** — not this story.

### UX / product context

- UJ-1: Maya creates Account, provisions two Tenants `support` and `docs` — names are human labels; IDs are system-generated. [Source: `design-artifacts/amkp-html-docs/ux-journeys.html` UJ-1]
- Surfaces are API/SDK/Docs — no workforce console UI in MVP for this story.

### Project Structure Notes

```
apps/api/src/
  tenancy/                 # NEW Nest module + controllers + admin guard
packages/domain/src/       # UPDATE — Account/Tenant types
packages/application/src/
  tenancy/                 # NEW ports + use-cases (preferred)
  index.ts                 # re-exports
packages/adapters-postgres/
  prisma/schema.prisma     # NEW
  src/                     # Prisma client wrapper + repo adapters
packages/openapi/          # UPDATE — Account/Tenant paths
```

Dependency direction: `adapters-postgres → application → domain`. `api` depends on `application` + `adapters-postgres` for Nest provider wiring.

### References

- `_bmad-output/planning-artifacts/epics.md` — Epic 1 Story 1.1 / T-1.1
- `_bmad-output/planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md` — AD-1, AD-2, AD-3, AD-8, AD-9, AD-10, Consistency Conventions, Structural Seed
- `_bmad-output/specs/spec-amkp/SPEC.md` — CAP-1
- `_bmad-output/specs/spec-amkp/stack.md` — version pins
- `_bmad-output/specs/spec-amkp/glossary.md` — Account / Tenant
- `_bmad-output/specs/spec-amkp/fr-map.md` — FR1 → E1 / 1.1
- `design-artifacts/amkp-html-docs/ux-journeys.html` — UJ-1
- `packages/domain/src/index.ts`, `packages/application/src/index.ts`, `packages/adapters-postgres/src/index.ts`, `apps/api/src/*`

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5 (Amelia / bmad-dev-story)

### Debug Log References

- Vitest + Nest DI: constructor type metadata missing under Vite → fixed with explicit `@Inject(Symbol)` tokens in `TenancyController`.
- Host port 5432 conflict with existing `tmn-postgres` → compose Postgres remapped to host `5433`.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created (2026-07-15).
- Implemented T-1.1: Account/Tenant CRUD APIs with Platform Admin Bearer gate, Prisma 7.8 + `@prisma/adapter-pg`, SHA-256 API key hashing (plaintext once on create).
- IDs: `acc_` / `ten_` + ULID; Tenants default `agenticEnabled: false` (AD-8).
- Tests: 5 unit (application) + 3 integration (api) + openapi validate — all green.
- **Migrate:** `DATABASE_URL=postgresql://amkp:amkp@localhost:5433/amkp pnpm --filter @amkp/adapters-postgres exec prisma migrate deploy` (after `pnpm docker:up`).
- **Dev:** `cp .env.example .env` → `pnpm docker:up` → migrate → `pnpm --filter @amkp/adapters-postgres build` → `pnpm --filter @amkp/domain build && pnpm --filter @amkp/application build && pnpm --filter @amkp/api dev`
- TS pin remains 5.8.3 (stack.md lists 7.0.2) — deferred.
- No `sprint-status.yaml` — story status tracked in this file only.

### File List

- `.env.example`
- `.gitignore`
- `README.md`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/vitest.config.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `apps/api/src/common/api-exception.filter.ts`
- `apps/api/src/tenancy/platform-admin.guard.ts`
- `apps/api/src/tenancy/tenancy.controller.ts`
- `apps/api/src/tenancy/tenancy.integration.test.ts`
- `apps/api/src/tenancy/tenancy.module.ts`
- `apps/api/src/tenancy/tenancy.tokens.ts`
- `infra/docker-compose.yml`
- `packages/adapters-postgres/package.json`
- `packages/adapters-postgres/prisma.config.ts`
- `packages/adapters-postgres/prisma/schema.prisma`
- `packages/adapters-postgres/prisma/migrations/migration_lock.toml`
- `packages/adapters-postgres/prisma/migrations/20260714202451_init_tenancy/migration.sql`
- `packages/adapters-postgres/src/client.ts`
- `packages/adapters-postgres/src/index.ts`
- `packages/adapters-postgres/tsconfig.json`
- `packages/adapters-postgres/vitest.config.ts`
- `packages/application/package.json`
- `packages/application/src/index.ts`
- `packages/application/src/tenancy/create-account.ts`
- `packages/application/src/tenancy/create-tenant.ts`
- `packages/application/src/tenancy/index.ts`
- `packages/application/src/tenancy/list-tenants.ts`
- `packages/application/src/tenancy/ports.ts`
- `packages/application/src/tenancy/tenancy.test.ts`
- `packages/application/tsconfig.json`
- `packages/application/vitest.config.ts`
- `packages/domain/src/index.ts`
- `packages/openapi/openapi.yaml`
- `packages/openapi/package.json`
- `packages/openapi/scripts/validate.mjs`
- `_bmad-output/implementation-artifacts/1-1-create-account-tenant-apis.md`

### Change Log

- 2026-07-15: Story context created (ready-for-dev) for T-1.1 / FR1 / CAP-1
- 2026-07-15: Implemented Account/Tenant APIs, Prisma tenancy schema, OpenAPI, vitest suite — status → review
