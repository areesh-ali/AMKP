---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - prds/prd-RAG-Sol-2026-07-14/prd.md
  - architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md
  - ../specs/spec-amkp/SPEC.md
  - ../../design-artifacts/amkp-html-docs/ux-journeys.html
status: final
updated: 2026-07-14
---

# AMKP - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AMKP, decomposing PRD, UX journeys, Architecture Spine, and SPEC CAP-1–8 into implementable stories. Ticket IDs `T-N.M` match stories `N.M`. Build order: **E1 → E2 → E3 → E5 (isolation early) → E4 → E6 → E7 → E8**.

## Requirements Inventory

### Functional Requirements

FR1: Platform Admin can create an Account and one or more Tenants with unique IDs; credentials are scoped only to that Tenant; listing Tenants never crosses Accounts.
FR2: Authentication derives Tenant server-side from API key or JWT; client-supplied Tenant override is ignored or rejected with 403.
FR3: Platform Admin can create, revoke, and rotate API keys per Tenant; revoked keys return 401; key for Tenant A cannot Retrieve Tenant B.
FR4: Caller can upload/register a Document into a Tenant via API; response includes Document ID and async job ID; Document invisible to other Tenants.
FR5: System applies Parse Ladder during ingest and records which tier produced each Chunk; text-layer PDF can complete on cheap tier; low-confidence table/page can escalate when enabled.
FR6: System can produce TableEvidence with header/cell structure and parse_confidence ∈ [0,1] for recoverable tables.
FR7: System stores Document version/etag/hash on Chunks; re-ingest creates new version; Retrieve prefers latest by default; Trace shows version IDs.
FR8: Caller can hybrid-Retrieve (lexical + dense, optional rerank) Evidence within a Tenant; each item has stable Evidence ID and citation fields; empty list is valid 200.
FR9: Retrieve responses always use Evidence schema; MVP does not return free-form final-answer prose as primary contract.
FR10: PreferCorrectness mode returns structured insufficient_evidence when scores fall below configurable Tenant threshold.
FR11: Every Retrieve response includes CostEstimate (may be 0 on cache hit); agentic hops accumulate CostEstimate.
FR12: Router chooses single-pass vs Guarded Agentic Retrieval per request; new Tenants default single-pass only; Trace records decision and reason code.
FR13: Guarded Agentic Retrieval requires Agentic Readiness (or audited override); mode=agentic returns 403 if gate not passed.
FR14: Agentic path enforces max hops (default 3) and max cost; circuit breaker returns partial Evidence with termination_reason hop_budget or cost_budget.
FR15: Each agentic hop is recorded in Trace with tool/query, Evidence IDs, and incremental CostEstimate; Trace API returns ordered steps.
FR16: Hard Tenant isolation at retrieve: namespace/collection per Tenant; fail closed without TenantContext; cache keys include tenant_id.
FR17: MCP tools bind Tenant from auth; parameters cannot select another Tenant; planted cross-Tenant Document IDs return empty/not found.
FR18: Automated Leak Test suite runnable in CI and on schedule; plants A/B Documents; asserts zero B content across Retrieve, cache, MCP; alerts on failure.
FR19: Caller with Tenant scope can fetch Trace by request ID; includes Tenant, router decision, Evidence IDs, CostEstimate, timestamps; cross-Tenant denied.
FR20: System exposes metrics for retrieve latency, error rate, agentic hop rate, CostEstimate totals per Tenant (Prometheus-compatible export assumed).
FR21: Caller can run golden-set eval job against a Tenant; machine-readable report with per-question outcomes; judge model ID recorded when used.
FR22: POC multimodal pack eval reports TableRank vs text-only ablation; design-partner threshold is target not hard block in MVP.
FR23: New Accounts can access POC Pack (docs + fixtures + scripts/API) self-serve without sales-only gate; ACL suite included with pass criteria.
FR24: Versioned HTTP Ingest/Retrieve API with published OpenAPI; breaking changes require version bump.
FR25: Official TypeScript/JavaScript SDK covers auth, ingest, retrieve, trace get; README path signup→key→ingest→retrieve in <60 minutes.
FR26: MCP server exposes Retrieve for a Tenant; documented connect path for at least one reference client; FR17 isolation applies.
FR27: Reference multi-Product app demonstrates two Products / two Tenants under one Account; README reproduces UJ-1; includes scripted Leak Test.

### NonFunctional Requirements

NFR1: Security — Tenant isolation fail-closed; secrets not logged; TLS in transit; encryption at rest.
NFR2: Privacy — No training on customer Documents; retention configurable; Tenant delete removes searchable Chunks within 24h.
NFR3: Reliability — MVP monthly uptime target 99.5% for Retrieve API.
NFR4: Observability — Traces + metrics; structured JSON logs with tenant_id and request_id; never log raw Document bodies or keys.
NFR5: Performance — Single-pass p95 Retrieve ≤ 800ms excluding customer LLM at agreed corpus size.
NFR6: DX — OpenAPI + docs; time-to-first-Retrieve < 60 minutes.
NFR7: Cost controls — CostEstimate per request; Account soft alert + hard 429 caps.
NFR8: Residency — Single-region US for MVP; EU post-MVP.
NFR9: Compliance support — Trace export available; no claim AMKP alone makes systems compliant.
NFR10: Success counters — ≥90% production Retrieves single-pass; Leak Test 0 cross-Tenant over 14-day soak; TableRank material lift.

### Additional Requirements

- Epic 1 Story 0 / bootstrap: pnpm NestJS hexagonal monorepo per Architecture Structural Seed (`apps/api`, `apps/worker`, domain/application/adapters packages, docker-compose).
- AD-1–AD-10 binding (hex boundaries, TenantContext, fail-closed namespaces, EvidenceEnvelope, BullMQ async heavy work, MCP thin facade, OTel, budgets, Postgres+pgvector SoR, api+worker topology).
- Isolation/Leak Tests required in CI for retrieve/cache/MCP changes.
- Deferred: Python VLM sidecar, Qdrant, VPC, connectors, generate API.

### UX Design Requirements

UX-DR1: Primary surfaces REST / SDK / Docs / MCP / Console — not workforce chat UI.
UX-DR2: Console provisions two Tenant API keys for UJ-1.
UX-DR3: Docs + SDK samples accelerate first Ingest/Retrieve.
UX-DR4: Citation-obligatory Evidence objects as primary retrieve UX.
UX-DR5: MCP retrieve wiring for Cursor / Claude Desktop.
UX-DR6: Docs expose runnable Leak Test job.
UX-DR7: Expose parse_confidence on escalated Evidence.
UX-DR8: Self-serve POC Pack from public docs.
UX-DR9: Bake-off report shows faithfulness, TableRank, hop/cost caps.
UX-DR10: Agentic Readiness gate + override audit trail docs.
UX-DR11: Trace by request ID shows Evidence IDs, parse path, router, CostEstimate.
UX-DR12: Re-ingest version watermark feedback.
UX-DR13: PreferCorrectness insufficient_evidence as first-class structured state.
UX-DR14: DX bar — hard isolation feel; bad answers traceable in minutes.

### FR Coverage Map

| FR | Epic | Stories |
| --- | --- | --- |
| FR1 | E1 | 1.1 |
| FR2 | E1 | 1.2 |
| FR3 | E1 | 1.2 |
| FR4 | E2 | 2.1 |
| FR5 | E2 | 2.2, 2.4 |
| FR6 | E2 | 2.3 |
| FR7 | E2 | 2.5 |
| FR8 | E3 | 3.1 |
| FR9 | E3 | 3.2 |
| FR10 | E3 | 3.3 |
| FR11 | E3 | 3.4 |
| FR12 | E4 | 4.1 |
| FR13 | E4 | 4.2 |
| FR14 | E4 | 4.3 |
| FR15 | E4 | 4.4 |
| FR16 | E5 | 5.1, 5.2 |
| FR17 | E5 | 5.3 |
| FR18 | E5 | 5.4 |
| FR19 | E6 | 6.1 |
| FR20 | E6 | 6.2 |
| FR21 | E7 | 7.1 |
| FR22 | E7 | 7.2 |
| FR23 | E7 | 7.3 |
| FR24 | E8 | 8.1 |
| FR25 | E8 | 8.2 |
| FR26 | E8 | 8.3 |
| FR27 | E8 | 8.4 |
| NFR5 / SM-6 | E3 | 3.5 |
| Bootstrap / AD seed | E1 | 1.0 |

## Epic List

1. **Epic 1 — Account, Tenant & Auth** — Platform admin can create isolated Tenants and credentials (CAP-1). Includes monorepo bootstrap story.
2. **Epic 2 — Ingest & Parse Ladder** — Operators ingest Documents into searchable Chunks with TableEvidence and versions (CAP-2).
3. **Epic 3 — Single-pass Retrieve** — Developers retrieve citation-obligatory Evidence with PreferCorrectness and CostEstimate (CAP-3).
4. **Epic 5 — Isolation & Leak Tests** *(schedule after E3 start / before E4)* — Hard Tenant isolation proven across index, cache, MCP (CAP-5).
5. **Epic 4 — Guarded Agentic Router** — Budgeted multi-hop only behind Agentic Readiness (CAP-4).
6. **Epic 6 — Observability** — Traces and per-Tenant metrics for debug and ops (CAP-6).
7. **Epic 7 — Eval & POC Pack** — Self-serve bake-off with TableRank (CAP-7).
8. **Epic 8 — Developer Surfaces** — OpenAPI, TS SDK, MCP, reference multi-Product app (CAP-8).

### Suggested sprint slices

| Sprint | Stories | Outcome |
| --- | --- | --- |
| S1 | 1.0–1.3, 5.1, 2.1 | Monorepo + auth + empty Tenant isolation + ingest stub |
| S2 | 2.2–2.3, 3.1–3.2, 5.2 | Text retrieve + TableEvidence + cache isolation |
| S3 | 3.3–3.5, 5.3–5.4, 6.1 | PreferCorrectness, Leak CI, Traces |
| S4 | 4.1–4.4, 6.2 | Guarded agentic + metrics |
| S5 | 2.4–2.5, 7.1–7.3 | Vision tier + eval/POC |
| S6 | 8.1–8.4 | DX launch |

---

## Epic 1: Account, Tenant & Auth

Platform Admin can create Accounts/Tenants and Tenant-bound credentials so every API call is hard-scoped (CAP-1). Story 1.0 bootstraps the Architecture Structural Seed.

### Story 1.0: Monorepo bootstrap (T-1.0)

As a platform engineer,
I want a NestJS hexagonal pnpm monorepo with api, worker, and shared packages,
So that all later stories land in the Architecture seed without inventing structure.

**Acceptance Criteria:**

**Given** an empty application tree
**When** bootstrap is complete
**Then** `apps/api`, `apps/worker`, packages `domain`, `application`, `adapters-postgres`, `adapters-redis`, `adapters-providers`, `sdk-js`, `openapi`, and `infra/docker-compose.yml` exist
**And** `pnpm install` and a health endpoint on api succeed against compose Postgres/Redis

### Story 1.1: Create Account & Tenant APIs (T-1.1)

As a Platform Admin,
I want to create an Account and Tenants with unique IDs,
So that each Product has an isolation boundary.

**Acceptance Criteria:**

**Given** a valid admin credential
**When** I POST Account and Tenant
**Then** unique IDs are returned and Tenant credential is scoped only to that Tenant
**And** listing Tenants for Account A never includes Account B Tenants
**And** OpenAPI documents the endpoints

### Story 1.2: Tenant-bound API keys (T-1.2)

As a Platform Admin,
I want create/revoke/rotate API keys per Tenant,
So that Products authenticate without spoofing Tenant.

**Acceptance Criteria:**

**Given** a key issued for Tenant A
**When** Retrieve/Ingest is called
**Then** TenantContext is derived from the key only
**And** body Tenant override returns 403
**And** revoked key returns 401 on subsequent calls

### Story 1.3: Auth integration tests (T-1.3)

As a platform engineer,
I want automated auth/isolation auth-path tests,
So that override and revoke regressions fail CI.

**Acceptance Criteria:**

**Given** the auth test suite
**When** CI runs
**Then** override-reject and revoke paths are covered and green

---

## Epic 2: Ingest & Parse Ladder

Caller can ingest Documents into a Tenant and obtain indexed Chunks via Parse Ladder with TableEvidence and version watermarks (CAP-2).

### Story 2.1: Ingest API + async jobs (T-2.1)

As a Product developer,
I want to upload a Document and get Document + job IDs,
So that ingest does not block my request thread.

**Acceptance Criteria:**

**Given** a Tenant-scoped key
**When** I upload a Document
**Then** response includes Document ID and async job ID
**And** the Document is not listable from another Tenant
**And** work is enqueued on BullMQ `ingest`/`parse` queues

### Story 2.2: Parse Ladder tiers 1–2 (T-2.2)

As a platform engineer,
I want cheap and layout-aware parse tiers,
So that text PDFs index without VLM cost.

**Acceptance Criteria:**

**Given** a text-layer PDF
**When** parse completes
**Then** Chunks record the parse tier used
**And** completion occurs on cheap tier without VLM

### Story 2.3: TableEvidence path (T-2.3)

As a Product developer,
I want table structure preserved as TableEvidence,
So that table/chart questions can be answered faithfully.

**Acceptance Criteria:**

**Given** a Document with recoverable tables
**When** parse and retrieve run on multimodal gold fixtures
**Then** TableEvidence with headers/cells can be returned
**And** parse_confidence ∈ [0,1] is present

### Story 2.4: Optional page-vision tier flag (T-2.4)

As a Platform Admin,
I want a per-Tenant flag for page-vision tier,
So that VLM spend is opt-in.

**Acceptance Criteria:**

**Given** page-vision disabled for a Tenant
**When** a scanned deck is ingested
**Then** no VLM spend occurs
**And** enabling the flag allows escalation

### Story 2.5: Document version watermark (T-2.5)

As a Product engineer,
I want re-ingest to create a new version preferred on Retrieve,
So that stale answers can be fixed (UJ-3).

**Acceptance Criteria:**

**Given** an updated Document re-ingested
**When** Retrieve runs
**Then** latest version is preferred by default
**And** Trace/Evidence exposes version id

---

## Epic 3: Single-pass Retrieve

Caller gets hybrid Evidence with citations, PreferCorrectness, and CostEstimate — no generate API (CAP-3).

### Story 3.1: Hybrid retrieve + rerank (T-3.1)

As a Product developer,
I want hybrid Retrieve within my Tenant,
So that I get ranked Evidence with citations.

**Acceptance Criteria:**

**Given** indexed Chunks for my Tenant
**When** I call Retrieve
**Then** response includes Evidence IDs, citations, scores
**And** empty result is 200 with empty list (not fabricated answer)

### Story 3.2: EvidenceEnvelope schema (T-3.2)

As a platform engineer,
I want a versioned EvidenceEnvelope contract,
So that REST and MCP cannot drift into chat answers.

**Acceptance Criteria:**

**Given** a Retrieve response
**When** schema is validated
**Then** citation fields are required
**And** no primary final-answer field exists in MVP Retrieve

### Story 3.3: PreferCorrectness mode (T-3.3)

As a Product developer,
I want PreferCorrectness,
So that low-coverage queries refuse instead of guessing.

**Acceptance Criteria:**

**Given** PreferCorrectness enabled and scores below Tenant threshold
**When** Retrieve runs
**Then** structured `insufficient_evidence` is returned
**And** threshold is configurable per Tenant

### Story 3.4: CostEstimate on response (T-3.4)

As a Platform Admin,
I want CostEstimate on every Retrieve,
So that spend is visible per request.

**Acceptance Criteria:**

**Given** any Retrieve (including cache hit)
**When** response is returned
**Then** CostEstimate fields are present (may be 0)

### Story 3.5: p95 latency budget harness (T-3.5)

As a platform engineer,
I want a load harness for single-pass p95,
So that we track ≤800ms ex-LLM at agreed corpus size.

**Acceptance Criteria:**

**Given** the agreed corpus fixture
**When** the harness runs
**Then** report includes p95 latency excluding customer LLM time

---

## Epic 5: Isolation & Leak Tests

Hard Tenant isolation across index, cache, and MCP with automated Leak Tests (CAP-5). Schedule early (S1–S3).

### Story 5.1: Namespace-per-Tenant indexing (T-5.1)

As a security liaison,
I want dedicated vector namespaces per Tenant,
So that missing Tenant context fails closed.

**Acceptance Criteria:**

**Given** no resolved TenantContext
**When** a retrieve query is attempted
**Then** it does not execute / fails closed
**And** cross-Tenant retrieve never returns content

### Story 5.2: Tenant-keyed cache (T-5.2)

As a platform engineer,
I want cache keys to include tenant_id,
So that cross-Tenant cache hits are impossible.

**Acceptance Criteria:**

**Given** warmed cache for Tenant A
**When** Tenant B queries the same text
**Then** tests prove no A content is served from cache

### Story 5.3: MCP Tenant binding (T-5.3)

As a Product developer,
I want MCP retrieve bound to connection auth,
So that tool params cannot select another Tenant.

**Acceptance Criteria:**

**Given** MCP connected as Tenant A
**When** params reference Tenant B Document IDs
**Then** result is empty/not found, never B content
**And** tool manifest has no cross-Tenant admin tools for Product credentials

### Story 5.4: Leak Test suite + CI (T-5.4)

As a security liaison,
I want Leak Tests in CI and on a schedule,
So that isolation regressions page operators.

**Acceptance Criteria:**

**Given** planted Documents in Tenants A and B
**When** suite runs as A
**Then** zero B content across Retrieve, cache warm, and MCP
**And** suite runs in CI; failure alerts webhook/email

---

## Epic 4: Guarded Agentic Router

Guarded Agentic Retrieval only when ready, with hop/cost budgets and per-step Traces (CAP-4).

### Story 4.1: Router default single-pass (T-4.1)

As a Platform Admin,
I want new Tenants single-pass only,
So that agentic usage stays rare and intentional.

**Acceptance Criteria:**

**Given** a new Tenant
**When** Retrieve is called without readiness
**Then** path is single-pass
**And** Trace records router decision + reason code

### Story 4.2: Agentic Readiness gate (T-4.2)

As a Platform Admin,
I want Agentic Readiness before agentic mode,
So that security bake-offs can require proof first.

**Acceptance Criteria:**

**Given** gate not passed
**When** `mode=agentic` is requested
**Then** API returns 403
**And** explicit override writes audit log with actor + timestamp

### Story 4.3: Hop & cost circuit breakers (T-4.3)

As a Platform Admin,
I want max hops (default 3) and cost circuit breakers,
So that loops cannot unbounded-spend.

**Acceptance Criteria:**

**Given** agentic mode enabled
**When** hop or cost budget is exceeded
**Then** loop stops with partial Evidence and `termination_reason` hop_budget|cost_budget
**And** defaults are conservative and Tenant-configurable within Account limits

### Story 4.4: Agentic step Traces (T-4.4)

As a Product engineer,
I want every hop in the Trace,
So that multi-hop spend and Evidence are auditable.

**Acceptance Criteria:**

**Given** an agentic request with hops > 1
**When** Trace is fetched
**Then** ordered steps include tool/query, Evidence IDs, incremental CostEstimate
**And** no hop is omitted

---

## Epic 6: Observability

Caller can fetch Traces; operators see per-Tenant latency/cost/hop metrics (CAP-6).

### Story 6.1: Trace get API (T-6.1)

As a Product engineer,
I want Trace by request ID,
So that I can debug bad answers without guessing (UJ-3).

**Acceptance Criteria:**

**Given** a request I issued under Tenant A
**When** I GET Trace by request ID
**Then** response includes Tenant, router decision, Evidence IDs, CostEstimate, timestamps
**And** cross-Tenant access returns 403/404

### Story 6.2: Metrics export (T-6.2)

As a platform operator,
I want Prometheus-compatible metrics with Tenant labels,
So that latency, errors, hop rate, and cost are observable.

**Acceptance Criteria:**

**Given** production traffic
**When** metrics are scraped
**Then** retrieve latency, error rate, agentic hop rate, and CostEstimate totals include Tenant dimension

---

## Epic 7: Eval & POC Pack

Self-serve golden-set evals, TableRank multimodal pack, and POC Pack (CAP-7).

### Story 7.1: Golden-set eval runner (T-7.1)

As a security liaison,
I want to run golden-set eval jobs,
So that bake-offs produce machine-readable scores.

**Acceptance Criteria:**

**Given** a golden question set and Tenant
**When** eval job completes
**Then** report has per-question outcomes
**And** judge model ID is recorded when LLM-judge is used

### Story 7.2: Multimodal pack + TableRank (T-7.2)

As a design-partner engineer,
I want TableRank vs text-only ablation,
So that multimodal lift is measurable (SM-4).

**Acceptance Criteria:**

**Given** the multimodal chart/table fixture pack
**When** eval runs multimodal and text-only configs
**Then** report includes both TableRank scores

### Story 7.3: Self-serve POC Pack (T-7.3)

As a new Account user,
I want POC Pack from public docs,
So that bake-off is not sales-gated (UJ-2).

**Acceptance Criteria:**

**Given** a self-serve Account
**When** I open public docs/console
**Then** POC Pack (fixtures + scripts/API + ACL suite) is linked and runnable with documented pass criteria

---

## Epic 8: Developer Surfaces

Versioned HTTP API, TypeScript SDK, MCP retrieve, and reference multi-Product app (CAP-8).

### Story 8.1: Versioned HTTP + OpenAPI (T-8.1)

As a Product developer,
I want versioned OpenAPI for Ingest/Retrieve,
So that integrations are stable (SM-1).

**Acceptance Criteria:**

**Given** MVP endpoints
**When** OpenAPI is published
**Then** Ingest/Retrieve are documented
**And** breaking changes require version bump (policy documented)

### Story 8.2: TypeScript SDK (T-8.2)

As a Product developer,
I want an official TS SDK,
So that signup→key→ingest→retrieve takes <60 minutes.

**Acceptance Criteria:**

**Given** the SDK README on a reference machine
**When** I follow the happy path
**Then** auth, ingest, retrieve, and trace get work
**And** stopwatch path completes in <60 minutes

### Story 8.3: MCP retrieve server (T-8.3)

As a Product developer,
I want MCP retrieve for my Tenant,
So that agents share the Knowledge Plane (UJ-1).

**Acceptance Criteria:**

**Given** documented MCP connect config for a reference client
**When** I connect and call retrieve
**Then** EvidenceEnvelope is returned under Tenant auth
**And** Story 5.3 isolation tests remain green

### Story 8.4: Reference multi-Product app (T-8.4)

As a platform engineer,
I want a reference app with two Tenants,
So that UJ-1 and Leak Test are reproducible.

**Acceptance Criteria:**

**Given** the reference app README
**When** I follow it
**Then** two Products/Tenants under one Account demonstrate Retrieve with citations
**And** a scripted Leak Test invocation is included

---

## Out of ticket scope (parking lot)

VPC, connector catalog, vertical packs, generate API, OSS split, insurance tenancy SLA — see PRD non-goals.
