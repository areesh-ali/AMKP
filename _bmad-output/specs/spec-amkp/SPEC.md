---
id: SPEC-amkp
companions:
  - glossary.md
  - fr-map.md
  - failure-modes.md
  - stack.md
  - ../planning-artifacts/epics.md
  - ../../design-artifacts/amkp-html-docs/ux-journeys.html
  - ../../design-artifacts/amkp-html-docs/requirements-map.html
  - ../planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md
  - ../planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/architecture-walkthrough.html
sources:
  - ../planning-artifacts/prds/prd-RAG-Sol-2026-07-14/prd.md
  - ../planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/brief.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# AMKP — Agentic Multimodal Knowledge Plane

## Why

**Pain + opportunity.** Multi-product software teams must ship grounded AI features but rebuild retrieval stacks per Product, leak soft tenancy boundaries, miss answers that live in tables/charts, and burn budget on unbounded agentic loops. Buyers are eval- and governance-first; MCP is the agent↔knowledge handshake. AMKP exists so platform engineers can share one Evidence + Policy + Tenancy plane across Products—with measurable isolation, multimodal structure fidelity, and guarded multi-hop—without becoming a workforce search UI.

## Capabilities

- **CAP-1**
  - **intent:** Platform Admin can create Accounts/Tenants and credentials so every call is scoped to exactly one Tenant derived from auth.
  - **success:** Credential for Tenant A cannot Retrieve Tenant B content; body-supplied Tenant override is rejected; revoked keys return 401.

- **CAP-2**
  - **intent:** Caller can Ingest Documents into a Tenant and obtain indexed Chunks via a Parse Ladder that can emit TableEvidence and version watermarks.
  - **success:** Ingested Document invisible to other Tenants; table gold fixtures can return TableEvidence with structure; Chunks carry Document version/hash.

- **CAP-3**
  - **intent:** Caller can hybrid-Retrieve ranked Evidence with citations, PreferCorrectness, and CostEstimate without requiring AMKP to own generation.
  - **success:** Response is Evidence schema (not free-form final answer as primary contract); insufficient Evidence yields structured insufficient_evidence under PreferCorrectness; CostEstimate always present.

- **CAP-4**
  - **intent:** System can route to Guarded Agentic Retrieval only when enabled, with hop/cost budgets and per-step Traces.
  - **success:** Default Tenant is single-pass only; agentic without readiness returns 403; exceeding hop/cost budgets terminates with explicit reason; Trace lists every hop.

- **CAP-5**
  - **intent:** System enforces hard Tenant isolation across index, cache, and MCP, and provides automated Leak Tests.
  - **success:** Continuous soak Leak Tests show zero cross-Tenant disclosures for design partners; MCP cannot select another Tenant via parameters.

- **CAP-6**
  - **intent:** Caller can fetch a Trace for their request and operators can see per-Tenant latency/cost/hop metrics.
  - **success:** Trace by request ID returns router decision, Evidence IDs, costs; cross-Tenant Trace access denied; metrics export includes Tenant dimension.

- **CAP-7**
  - **intent:** Caller can run golden-set evals including TableRank multimodal pack and access a self-serve POC Pack.
  - **success:** Eval job emits machine-readable report; TableRank reported vs text-only ablation; POC Pack reachable from docs/console without sales gate.

- **CAP-8**
  - **intent:** Developer can integrate via versioned HTTP API, one official SDK, MCP retrieve tool, and a reference multi-Product app.
  - **success:** Documented path signup→key→ingest→retrieve completes in <60 minutes; OpenAPI published; reference app demonstrates two Tenants + Leak Test script.

## Constraints

- Tenant identity comes from verified auth only — never from client-supplied free text alone.
- Isolation fails closed (namespace/collection per Tenant in MVP).
- No training on customer Document content.
- Agentic mode off until Agentic Readiness; default max hops = 3.
- MVP Retrieve primary contract is Evidence — not a generate/answer API.
- SaaS-first MVP; VPC/air-gap deferred.
- Evidence items must include citation fields (Document ID + location when known).
- Implementation backlog follows epic order E1→E2→E3→E5 (isolation early)→E4→E6→E7→E8 (see companions/epics.md).

## Non-goals

- Glean-class workforce / employee search UI
- General-purpose vector database product
- Unbounded agentic loops without budgets/traces
- Native connector marketplace in MVP
- Air-gapped appliance as MVP default
- OSS core + paid control plane split in MVP
- Training foundation models on customer data

## Success signal

A design-partner platform engineer stands up two Product Tenants in one day, passes continuous Leak Tests with zero cross-Tenant hits, shows TableRank lift on the multimodal pack vs text-only, and keeps ≥90% of production Retrieves on single-pass while agentic hops stay inside budgets—with Traces explaining any bad answer.

## Assumptions

- TypeScript/JavaScript is the first official SDK language.
- MVP region is single-region US; EU residency later.
- p95 single-pass Retrieve ≤ 800ms excluding customer LLM time at agreed corpus size.
- MVP monthly Retrieve uptime target 99.5%.
- Prometheus-compatible metrics export in MVP.
- Exact TableRank % threshold calibrated with design partners (material lift required).
- NestJS hexagonal monorepo (`api` + `worker`) is the MVP control-plane stack (see stack.md).

## Open Questions

- First design-partner vertical: horizontal SaaS vs finance filings vs manufacturing?
- Exact TableRank target % after calibration?
- EU residency timeline?
- Ever ship generate API or permanently BYO LLM?
