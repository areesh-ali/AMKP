---
id: SPEC-amkp-console
status: ready-for-dev
companions:
  - glossary.md
  - surfaces.md
  - handoff.md
  - epics.md
  - ../spec-amkp/SPEC.md
  - ../spec-amkp/glossary.md
  - ../planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md
  - ../A-Product-Brief/product-brief.md
  - ../A-Product-Brief/visual-direction.md
  - ../B-Trigger-Map/trigger-map.md
  - ../planning-artifacts/ux-designs/ux-AMKP-2026-07-16/DESIGN.md
  - ../planning-artifacts/ux-designs/ux-AMKP-2026-07-16/EXPERIENCE.md
  - ../planning-artifacts/ux-designs/ux-AMKP-2026-07-16/ui-ideas.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate.

# AMKP — Human product layer (Console) on the plane

## Why

**Pain + opportunity.** AMKP is an enterprise knowledge plane: better RAG under products, hard tenancy, multimodal structure, and guarded agentic when enabled. Builders still need a first-party **human product layer** to operate that plane—without renaming or replacing the SDK, MCP, or API. Under the **AMKP** brand, Console is that layer: production-quality web UX for Platform Admins and Tenant Operators alongside the existing DX kit (SDK, MCP, OpenAPI, reference app).

## Brand & portfolio (locked)

| Noun | Role |
| --- | --- |
| **AMKP** | Brand + plane (API/worker) + enterprise promise (better RAG, guarded agentic) |
| **AMKP Console** | First-party web product for humans to operate the plane |
| **SDK / MCP / OpenAPI** | Remain; not replaced by Console |

## Capabilities

- **CAP-1**
  - **intent:** Authorized users can establish a Console session with a clear role (Platform Admin vs Tenant Operator) so every subsequent action runs under that authorization.
  - **success:** Unauthenticated users cannot reach protected surfaces; a Tenant Operator cannot perform Platform Admin actions; session expiry returns the user to sign-in without leaking prior Tenant data.

- **CAP-2**
  - **intent:** Platform Admin can create and manage Accounts, Tenants, and API keys, and review audit activity for those resources.
  - **success:** Admin can complete Account→Tenant→API key issuance in-product; revoke/rotate is visible and enforced on subsequent plane calls; audit list shows actor/action/time for those mutations.

- **CAP-3**
  - **intent:** Tenant Operator can ingest Documents (including upload), browse status/versions/chunks, and manage lifecycle (reparse, delete, prune, download) for their Tenant.
  - **success:** Uploaded Document appears in Tenant document list with status progression; another Tenant’s documents never appear; content download and delete affect only the active Tenant.

- **CAP-4**
  - **intent:** Tenant Operator can run Retrieve (single-pass and, when allowed, agentic), inspect ranked Evidence with citations, PreferCorrectness outcomes, and CostEstimate.
  - **success:** Retrieve results render Evidence items (not a free-form final answer as the primary contract); insufficient_evidence is shown as a first-class outcome; CostEstimate is always visible on the result.

- **CAP-5**
  - **intent:** Tenant Operator can open a Trace for a request they own and understand router decision, hops/steps, Evidence IDs, and cost.
  - **success:** Trace for a known requestId loads with those fields; requesting another Tenant’s Trace is denied in the UI and by the plane; agentic hops appear as discrete steps when present.

- **CAP-6**
  - **intent:** Tenant Operator can run golden-set and TableRank evals from the Console and read machine-readable reports, including POC Pack entry points.
  - **success:** Eval run produces a report view with pass/fail summary; TableRank ablation contrast is visible when run; POC Pack docs/fixtures are reachable without a sales gate.

- **CAP-7**
  - **intent:** Authorized Operator/Admin can view and change Tenant policy flags (page-vision, agentic readiness/override, PreferCorrectness threshold) with an audit trail.
  - **success:** Toggle/threshold change persists via plane admin APIs; UI reflects new state after refresh; audit records the change.

- **CAP-8**
  - **intent:** Platform Admin can observe plane health/readiness/adapter summary and run safe ops actions (e.g. orphan storage sweep dry-run).
  - **success:** Health/ready states are visible without secrets; dry-run sweep returns scanned/orphaned counts; destructive ops require explicit confirmation.

- **CAP-9**
  - **intent:** A new developer can complete the guided path Account/Tenant→key→ingest→retrieve inside the Console without leaving the product.
  - **success:** Timed walkthrough completes in under 60 minutes on a fresh environment using only Console + running plane; success screen shows Evidence from the ingested Document.

## Constraints

- Console talks to AMKP **only** through published HTTP/SDK contracts — no UI process direct database or Redis access.
- Tenant isolation fails closed: active Tenant context is always explicit; cross-Tenant data never rendered.
- Retrieve UX primary contract remains **Evidence + citations + cost** — BYO LLM generation is out of Console’s primary contract.
- Product-quality bar: durable session, accessible UI, loading/empty/error states, confirmation for destructive actions, auditable admin mutations.
- SDK, MCP, and OpenAPI remain supported DX surfaces under the AMKP brand.

## Non-goals

- Replacing SDK/MCP with Console-only integration
- Glean-class workforce / employee enterprise search
- Generate/answer chat as the primary Console contract
- Renaming the plane away from AMKP
- Native connector marketplace or air-gapped appliance UI in this layer

## Success signal

Under the AMKP brand, a Platform Admin stands up two Product Tenants in Console, issues keys, and a Tenant Operator ingests a multimodal fixture, runs Retrieve with visible Evidence/cost, opens the Trace, runs a golden-set eval, and toggles Tenant policy—while Leak/isolation checks still show zero cross-Tenant disclosure. SDK/MCP paths continue to work unchanged.

## Assumptions

- Display name **AMKP**; Console referred to as **AMKP Console** in docs/UI chrome.
- Repo path `apps/console`; consumes `@amkp/sdk-js`.
- English-first UI.
- Session v1 may use secured credential vault mapped to plane admin/tenant auth; OIDC can replace without renaming the product.
- **Operator home interaction grammar** is Claude-like (threads, composer, upload, agent working steps, artifacts). The primary Retrieve climax remains Evidence + citations + cost; optional grounded gloss is secondary — not free-form ungrounded chat as the product promise.

## Open Questions

- OIDC timeline vs credential-vault v1 (implementation sequencing only; brand fixed).
- Org hierarchy beyond Account→Tenant (defer unless required for first Console release).
