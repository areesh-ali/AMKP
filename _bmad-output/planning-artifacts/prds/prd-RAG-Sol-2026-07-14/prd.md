---
title: AMKP — Agentic Multimodal Knowledge Plane
status: draft
created: 2026-07-14
updated: 2026-07-14
project: RAG-Sol
---

# PRD: AMKP — Agentic Multimodal Knowledge Plane

*Working title confirmed from Product Brief (2026-07-14).*

## 0. Document Purpose

This PRD is for RAG-Sol product/engineering stakeholders and downstream architecture, epic, and UX (developer experience) work. It builds on the Product Brief at `_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/`, market research, and brainstorm intent—those sources are not duplicated wholesale. Features use globally numbered FRs; Glossary terms are binding; inferred items are tagged `[ASSUMPTION]` and listed in §9.

## 1. Vision

AMKP is an API / SDK / MCP-first **Knowledge Plane** that multiple Products share. Platform teams ingest multimodal enterprise Documents once, retrieve typed Evidence under hard Tenant isolation, and optionally run Guarded Agentic Retrieval with budgets and traces—without rebuilding a RAG stack per Product and without adopting a workforce search UI.

Success means grounding becomes infrastructure: Product squads integrate retrieve/ingest tools the way they integrate payments or auth. Differentiation is measurable production guarantees—isolation, structure-aware multimodal fidelity, citation-obligatory Evidence, and sealed bake-off tooling—not chat chrome or a proprietary foundation model.

**Why now:** buyers are eval- and governance-first; MCP is the emerging agent↔knowledge handshake; multimodal table/page fidelity is practical but DIY-costly; RAG sprawl across Product teams is already visible. `[ASSUMPTION: SaaS-first MVP; VPC/self-host is a post-MVP enterprise track.]`

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** Ship grounded AI features across ≥2 Products without hiring a three-person ML platform team.
- **Functional:** Prove to security that Tenant A never retrieves Tenant B’s Evidence (including via cache and MCP).
- **Functional:** Answer questions whose answers live in tables/charts, not only prose.
- **Functional:** Use multi-hop retrieval only when needed, with predictable cost.
- **Emotional:** Stop fearing the next “confident wrong answer” incident or leak review.
- **Social:** Become the internal platform other Product squads adopt instead of forking LangChain apps.

### 2.2 Non-Users (v1)

- Enterprise IT buyers seeking a Glean-class employee search portal.
- Teams that only need a single-hop FAQ bot and will not pay for multimodal/tenancy guarantees.
- Buyers requiring air-gapped appliance on day one. `[ASSUMPTION]`

### 2.3 Key User Journeys

*API/platform product — lighter UJ form; named protagonists for FR anchoring.*

- **UJ-1. Maya stands up a second Product Tenant in a day.**  
  Maya, platform eng at a mid-market SaaS with Support and Docs bots forking the same stack, creates an Account, creates Tenant `support` and Tenant `docs`, uploads a PDF corpus to each via Ingest API, calls Retrieve, wires the MCP `retrieve` tool into both Product agents. Climax: both Products return Evidence with citations; leak-test job she ran from docs shows zero cross-Tenant hits. Edge: upload of a scanned deck triggers Parse Ladder escalation; she sees parse_confidence on Evidence.

- **UJ-2. Ken survives a security bake-off.**  
  Ken, staff eng + security liaison, runs the sealed POC pack: golden questions, ACL adversarial suite, multimodal chart pack. Climax: report shows faithfulness, TableRank lift vs text-only baseline, and hop/cost caps under load. Edge: agentic mode disabled until Agentic Readiness gate passes.

- **UJ-3. Priya debugs a bad answer without guessing.**  
  Priya, Product eng on Support, opens a Trace for a wrong answer, sees retrieved Evidence IDs, parse path, router decision (single-pass vs agentic), and CostEstimate. Climax: she fixes a stale Document version and re-ingessts; regression eval catches the case. Edge: PreferCorrectness mode would have refused instead of guessing.

## 3. Glossary

- **Account** — Customer organization billing and admin boundary. Contains one or more Tenants.
- **Tenant** — Hard isolation unit for a Product (or brand/environment). All Ingest/Retrieve/MCP calls are scoped to exactly one Tenant derived from auth, never from client-supplied free text alone.
- **Product** — Downstream application or agent surface that consumes AMKP (e.g. support assistant, in-app help).
- **Document** — Source file or object under Ingest (PDF, DOCX, image, etc.).
- **Chunk** — Indexed retrieval unit derived from a Document (text region, table, page image, etc.).
- **Evidence** — Structured retrieval result returned to the caller: content and/or typed payload, citation fields, scores, parse metadata. Generators (BYO LLM) consume Evidence; AMKP does not require owning generation.
- **TableEvidence** — Evidence subtype preserving table structure (headers/cells) rather than flattened prose only.
- **Parse Ladder** — Ordered ingest pipeline: cheap extract → layout-aware → VLM/page-vision tier, escalated by confidence/rules.
- **Knowledge Plane** — AMKP system as a whole: Ingest, Index, Retrieve, Policy, Eval, Observability.
- **Guarded Agentic Retrieval** — Multi-step retrieval controlled by the Router with hop budgets, tool ACL, and full Traces—not unbounded agent loops.
- **Router** — Component that chooses single-pass Retrieve vs Guarded Agentic Retrieval per request.
- **Trace** — End-to-end record of a request: auth Tenant, retrieval steps, Evidence IDs, costs, router decision.
- **Leak Test** — Automated adversarial check that Tenant A cannot retrieve Tenant B Evidence (including cache/MCP paths).
- **POC Pack** — Sealed bake-off kit: golden set template, ACL suite, multimodal chart pack, cost simulator.
- **TableRank** — Eval metric/score for table/chart question accuracy on a multimodal gold set.
- **Agentic Readiness** — Gate (checks + config) that must pass before Guarded Agentic Retrieval is enabled for a Tenant.
- **PreferCorrectness** — Response mode that refuses or returns low-coverage when Evidence is insufficient instead of free-form guessing.
- **MCP Tool** — Model Context Protocol tool exposing AMKP capabilities (at minimum retrieve; optionally ingest status) with Tenant scoped from connection auth.
- **CostEstimate** — Per-request estimated/actual cost fields returned with Retrieve (and agentic hops).

## 4. Features

### 4.1 Account, Tenant, and Auth

**Description:** Operators create Accounts and Tenants; every API/MCP call resolves Tenant from verified credentials (API key or JWT claims). Client body cannot override Tenant. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Create Account and Tenant

Platform Admin can create an Account and one or more Tenants with unique IDs under that Account.

**Consequences (testable):**
- Creating Tenant `T` yields a credential scoped only to `T`.
- Listing Tenants for Account `A` never includes Tenants of Account `B`.

#### FR-2: Tenant-bound authentication

Caller can authenticate such that Tenant is derived server-side from the credential.

**Consequences (testable):**
- Request that omits Tenant in body still scopes correctly from credential.
- Request that supplies a different Tenant ID in body is ignored or rejected (400/403); never honored over auth. `[ASSUMPTION: reject with 403.]`

#### FR-3: Per-Tenant API keys and rotation

Platform Admin can create, revoke, and rotate API keys per Tenant.

**Consequences (testable):**
- Revoked key returns 401 on subsequent Retrieve/Ingest.
- Key for Tenant A cannot Retrieve against Tenant B namespace.

### 4.2 Ingest and Parse Ladder

**Description:** Callers ingest Documents into a Tenant; Parse Ladder produces Chunks/Evidence-ready index entries with confidence metadata. Realizes UJ-1.

**Functional Requirements:**

#### FR-4: Ingest Document

Caller can upload or register a Document into a Tenant via API.

**Consequences (testable):**
- Successful ingest returns a Document ID and async job ID when processing is async.
- Document is invisible to other Tenants in list/get APIs.

#### FR-5: Parse Ladder execution

System applies Parse Ladder during ingest and records which tier produced each Chunk.

**Consequences (testable):**
- Text-layer PDF can complete on cheap tier without VLM.
- Low-confidence table/page can escalate to a higher tier when enabled for the Tenant. `[ASSUMPTION: page-vision tier is optional flag per Tenant.]`

#### FR-6: TableEvidence extraction

System can produce TableEvidence for detected tables when structure is recoverable.

**Consequences (testable):**
- Retrieve for a table-centric gold question can return TableEvidence with header/cell structure, not only flattened text, on the multimodal gold set fixtures.
- Parse metadata includes parse_confidence ∈ [0,1].

#### FR-7: Document versioning / freshness watermark

System stores source version or etag/hash on indexed Chunks.

**Consequences (testable):**
- Re-ingest of updated Document creates a new version; Retrieve can prefer latest. `[ASSUMPTION: latest-by-default.]`
- Trace shows Document version IDs for returned Evidence.

### 4.3 Retrieve (single-pass)

**Description:** Hybrid retrieval returns ranked Evidence with citations; PreferCorrectness and CostEstimate supported. Realizes UJ-1, UJ-3.

**Functional Requirements:**

#### FR-8: Hybrid Retrieve

Caller can Retrieve Evidence for a query within a Tenant using hybrid (lexical + dense) search with optional rerank.

**Consequences (testable):**
- Response includes ≥0 Evidence items each with stable Evidence ID and citation fields (Document ID, location/page when known).
- Zero results is a valid 200 with empty list (not a fabricated answer).

#### FR-9: Citation-obligatory Evidence shape

Retrieve responses always use the Evidence schema; generation is out of band (BYO LLM) unless a separate optional generate API is enabled later.

**Consequences (testable):**
- MVP Retrieve does not return free-form “final answer” prose as the primary contract. `[ASSUMPTION: generate API is non-goal for MVP.]`
- Evidence items include score and citation fields required by schema.

#### FR-10: PreferCorrectness mode

Caller can request PreferCorrectness on Retrieve (or on a thin optional answer helper if present).

**Consequences (testable):**
- When top Evidence scores fall below configured threshold, API returns a structured insufficient_evidence outcome rather than padded content.
- Threshold is configurable per Tenant.

#### FR-11: CostEstimate on Retrieve

Retrieve response includes CostEstimate for the request.

**Consequences (testable):**
- CostEstimate fields are present on every Retrieve response (may be 0 for cache hits).
- Agentic hops accumulate CostEstimate across steps (see FR-15).

### 4.4 Guarded Agentic Retrieval and Router

**Description:** Router defaults to single-pass; Guarded Agentic Retrieval requires Agentic Readiness and enforces hop budgets. Realizes UJ-2, UJ-3.

**Functional Requirements:**

#### FR-12: Router decision

System chooses single-pass vs Guarded Agentic Retrieval per request based on config + signals.

**Consequences (testable):**
- Default for new Tenants is single-pass only.
- Trace records router decision and reason code.

#### FR-13: Agentic Readiness gate

Platform Admin can enable Guarded Agentic Retrieval only after Agentic Readiness checks pass (or explicit override with audit).

**Consequences (testable):**
- Retrieve with `mode=agentic` returns 403 if gate not passed.
- Override creates an audit log entry with actor and timestamp.

#### FR-14: Hop budget and circuit breaker

Guarded Agentic Retrieval enforces max hops and max cost per request; circuit breaker trips on breach.

**Consequences (testable):**
- Exceeding max hops stops the loop and returns partial Evidence + termination_reason=`hop_budget`.
- Exceeding max cost stops with termination_reason=`cost_budget`.
- Defaults ship conservative; Tenant-configurable within Account limits. `[ASSUMPTION: default max hops = 3.]`

#### FR-15: Agentic step Traces

Each agentic hop is recorded in the Trace with tool/query, Evidence IDs, and incremental CostEstimate.

**Consequences (testable):**
- Trace API returns ordered steps for a request ID.
- No step is omitted when hops > 1.

### 4.5 Multi-Tenant Isolation and Leak Tests

**Description:** Isolation is enforced at index/cache/MCP layers; Leak Tests run continuously. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-16: Hard Tenant isolation at retrieve time

System ensures Retrieve for Tenant A never returns Evidence indexed under Tenant B.

**Consequences (testable):**
- Namespace/collection (or equivalent hard partition) is used such that missing Tenant filter fails closed, not open. `[ASSUMPTION: namespace-per-Tenant in MVP.]`
- Cache keys include Tenant MAC/ID; cross-Tenant cache hit is impossible by construction in tests.

#### FR-17: MCP Tenant scoping

MCP Tool connections bind Tenant from auth; tool parameters cannot select another Tenant.

**Consequences (testable):**
- MCP retrieve for Tenant A against planted Tenant B Document IDs returns not found / empty, never content.
- Tool manifest does not expose cross-Tenant admin tools to Product credentials.

#### FR-18: Automated Leak Test suite

System provides a Leak Test suite runnable in CI and on a schedule for design-partner Accounts.

**Consequences (testable):**
- Suite plants Documents in A and B, authenticates as A, asserts zero B content across Retrieve, cache warm path, and MCP.
- Failure pages/alerts design-partner operators. `[ASSUMPTION: alert channel = email/webhook in MVP.]`

### 4.6 Observability and Traces

**Description:** Request Traces and metrics for latency, cost, router mix, faithfulness sampling. Realizes UJ-3.

**Functional Requirements:**

#### FR-19: Trace retrieve by request ID

Caller with Tenant scope can fetch a Trace for a request they issued.

**Consequences (testable):**
- Trace includes Tenant ID, router decision, Evidence IDs, CostEstimate, timestamps.
- Cross-Tenant Trace access returns 404/403.

#### FR-20: Operational metrics

System exposes metrics for retrieve latency, error rate, agentic hop rate, and CostEstimate totals per Tenant.

**Consequences (testable):**
- Metrics endpoint or export includes the above labels with Tenant dimension.
- `[ASSUMPTION: Prometheus-compatible export in MVP.]`

### 4.7 Eval, TableRank, and POC Pack

**Description:** Bake-off and regression tooling as product surface. Realizes UJ-2.

**Functional Requirements:**

#### FR-21: Golden-set eval runner

Caller can run an eval job from a golden question set against a Tenant and receive scores (at least retrieval hit rate and faithfulness sampling).

**Consequences (testable):**
- Eval job returns a machine-readable report with per-question outcomes.
- Same fixture pack produces deterministic scores given fixed index snapshot. `[ASSUMPTION: LLM-judge faithfulness may be non-deterministic; report includes judge model ID.]`

#### FR-22: TableRank on multimodal pack

POC Pack includes a multimodal chart/table fixture set; eval reports TableRank vs text-only baseline configuration.

**Consequences (testable):**
- Report includes TableRank for multimodal path and for text-only ablation.
- Design-partner threshold is documented as a target, not a hard block, in MVP. `[ASSUMPTION: target = material lift; exact % set during design-partner calibration.]`

#### FR-23: POC Pack delivery

New Accounts can access POC Pack (docs + fixtures + scripts/API) without sales-only disclosure.

**Consequences (testable):**
- POC Pack is linked from public docs / console for self-serve Accounts.
- ACL adversarial suite is included and runnable with documented expected pass criteria.

### 4.8 Developer Surfaces (API, SDK, MCP, Docs)

**Description:** Primary UX is developer: REST/JSON API, at least one official SDK, MCP server, docs with time-to-first-Retrieve path. Realizes UJ-1.

**Functional Requirements:**

#### FR-24: Public Retrieve/Ingest HTTP API

Developer can perform Ingest and Retrieve via versioned HTTP API with OpenAPI spec.

**Consequences (testable):**
- OpenAPI published for MVP endpoints.
- Breaking changes require version bump.

#### FR-25: Official SDK (one language)

Developer can use an official SDK for the MVP language. `[ASSUMPTION: TypeScript/JavaScript first.]`

**Consequences (testable):**
- README path: signup → key → ingest sample → retrieve sample in < 60 minutes on a reference machine.
- SDK covers auth, ingest, retrieve, trace get.

#### FR-26: MCP server for Retrieve

Developer can connect an MCP-compatible agent to AMKP Retrieve for a Tenant.

**Consequences (testable):**
- Documented MCP connect path works with at least one reference client (e.g. Cursor or Claude Desktop config).
- Isolation tests in FR-17 apply.

#### FR-27: Reference multi-Product app

Repo ships a reference app demonstrating two Products sharing one Account with two Tenants.

**Consequences (testable):**
- Reference app README reproduces UJ-1 happy path.
- Includes a scripted Leak Test invocation.

## 5. Non-Goals (Explicit)

- Workforce / employee enterprise search UI (Glean-class).
- Becoming a general-purpose vector database product.
- Unbounded agentic loops without budgets/traces.
- Training foundation models on customer Document content.
- Full SaaS connector marketplace in MVP (Drive/Notion/etc. native sync).
- Air-gapped appliance / VPC as MVP default.
- OSS core + paid control plane split in MVP.
- Primary business of selling seat-based chat to knowledge workers.

## 6. MVP Scope

### 6.1 In Scope

- Account/Tenant/auth, Ingest + Parse Ladder (incl. optional page-vision tier), TableEvidence path
- Hybrid Retrieve, PreferCorrectness, CostEstimate
- Router + Guarded Agentic Retrieval with budgets + Agentic Readiness
- Hard isolation + Leak Tests + Traces/metrics
- Eval runner + TableRank multimodal pack + POC Pack
- HTTP API + one SDK + MCP retrieve + reference multi-Product app + docs

### 6.2 Out of Scope for MVP

- Native connector catalog — use API upload/MCP sources first
- VPC/private deployment — post-MVP enterprise
- Generate/answer API as primary contract — BYO LLM
- Vertical packs (filings/manufacturing) as SKUs — parking lot
- Insurance-backed tenancy SLA — parking lot
- Multi-language official SDKs beyond the first

## 7. Success Metrics

**Primary**
- **SM-1**: Time-to-first-Retrieve &lt; 60 minutes on documented happy path (external stopwatch study, n≥5 design-partner engineers). Validates FR-24–FR-27.
- **SM-2**: Leak Test continuous soak: 0 cross-Tenant disclosures for design-partner Accounts over 14-day window. Validates FR-16–FR-18.
- **SM-3**: ≥90% of production Retrieve requests served single-pass (no agentic hops) across design partners after steady state. Validates FR-12–FR-14.
- **SM-4**: TableRank material lift vs text-only ablation on POC multimodal pack for design partners. Validates FR-6, FR-22.

**Secondary**
- **SM-5**: Design partners run ≥2 Tenants (Products) in one Account within 30 days of first production traffic. Validates FR-1, UJ-1.
- **SM-6**: p95 Retrieve latency single-pass ≤ `[ASSUMPTION: 800ms]` excluding customer LLM time, at agreed corpus size.

**Counter-metrics (do not optimize)**
- **SM-C1**: Do not maximize agentic hop rate — counterbalances vanity “agentic usage.”
- **SM-C2**: Do not maximize Documents ingested without eval coverage — counterbalances empty scale.
- **SM-C3**: Do not optimize solely for public embedding leaderboard scores — corpus-specific eval wins.

## 8. Cross-Cutting NFRs

- **Security:** Tenant isolation fail-closed; secrets not logged; TLS in transit; encryption at rest `[ASSUMPTION: cloud KMS]`.
- **Privacy:** No training on customer Documents; retention configurable per Account `[ASSUMPTION: default retain until delete]`.
- **Reliability:** MVP target monthly uptime `[ASSUMPTION: 99.5%]` for Retrieve API.
- **Observability:** Traces + metrics as in §4.6; structured logs with Tenant ID redaction rules.
- **Performance:** Single-pass p95 per SM-6; agentic p95 documented separately with hop count.
- **DX:** OpenAPI + docs as product surface; copy-paste samples.

## 9. Constraints and Guardrails

### Safety
- PreferCorrectness and hop/cost budgets are default-safe controls.
- Agentic mode off until Agentic Readiness.

### Privacy / Data Governance
- Tenant boundaries are security boundaries.
- `[ASSUMPTION: data residency single-region US for MVP; EU region post-MVP.]`
- Customer may delete Tenant data; deletion removes searchable Chunks within `[ASSUMPTION: 24h]`.

### Cost
- CostEstimate visible per request; Account-level monthly soft/hard caps `[ASSUMPTION: soft alert + hard 429]`.

### Compliance awareness
- Product provides Trace export to support customer deployer obligations under regimes like EU AI Act; AMKP does not claim to make customer high-risk systems compliant by itself. `[NOTE FOR PM: legal review before marketing compliance claims.]`

## 10. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Hyperscaler/RaaS ships “good enough” bundle | Ship Leak Tests + POC Pack + TableRank as durable bake-off weapons |
| Multimodal cost blowups | Parse Ladder; optional page-vision; CostEstimate + caps |
| Agentic cancellations / fear | Default single-pass; readiness gate; hop budgets |
| Isolation bug = existential | Namespace-per-Tenant; CI Leak Tests; fail-closed |
| Scope creep into workforce UI | Non-goals enforced in epic reviews |

## 11. Monetization `[ASSUMPTION]`

- Free tier: limited ingest storage + Retrieve units for evaluation.
- Paid: usage (Retrieve/ingest/parse tiers) + Tenant count + eval job minutes.
- Enterprise later: VPC, SSO, residency, higher isolation attestations.

## 12. Open Questions

1. First design-partner vertical: horizontal SaaS vs finance filings vs manufacturing?
2. Exact TableRank target % after calibration?
3. MVP region and residency commitments?
4. Generate API ever in-product or permanently BYO LLM?
5. TypeScript-only SDK confirmed?
6. Hard vs soft Account cost caps UX?

## 13. Assumptions Index

- SaaS-first MVP; VPC later
- Namespace-per-Tenant isolation model
- page-vision tier optional per Tenant
- Latest Document version default on Retrieve
- Generate API non-goal for MVP
- Reject Tenant override attempts with 403
- Default max agentic hops = 3
- Leak Test alerts via email/webhook
- Prometheus-compatible metrics
- TypeScript/JavaScript first SDK
- Faithfulness judge may be non-deterministic; record model ID
- TableRank exact % calibrated with design partners
- p95 single-pass ≤ 800ms (ex-LLM) at agreed corpus size
- 99.5% monthly Retrieve uptime MVP
- US single-region MVP; EU later
- Deletion search-visibility ≤ 24h
- Soft alert + hard 429 for cost caps
- Free/usage/Tenant monetization shape
- Mid-market SaaS ICP with 2+ AI-facing Products
