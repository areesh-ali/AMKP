---
story_id: "3.2"
story_key: "3-2-evidence-envelope-schema"
ticket: "T-3.2"
epic: "3"
status: review
created: 2026-07-15
baseline_commit: "e414e17"
fr: ["FR9", "FR24"]
cap: ["CAP-3", "CAP-8"]
depends_on: ["T-3.1"]
blocks: ["T-3.3", "T-8.1"]
---

# Story 3.2: EvidenceEnvelope schema

Status: review

## Story

As a platform engineer,
I want a versioned EvidenceEnvelope contract,
so that REST and MCP cannot drift into chat answers.

## Acceptance Criteria

1. **AC1** — Citation fields required on Evidence items — ✅ OpenAPI `EvidenceItem.required` includes `citation`; runtime `assertEvidenceEnvelope` enforces `citation.documentId`
2. **AC2** — No primary final-answer field in MVP Retrieve response schema — ✅ Schema omits answer/finalAnswer/message/completion; validator forbids them; runtime guard rejects them
3. **AC3** — OpenAPI `/v1/retrieve` 200 documents EvidenceEnvelope — ✅ `$ref: EvidenceEnvelope` with Citation, CostEstimate, PreferCorrectnessOutcome

## Spec sync

- AD-4 versioned EvidenceEnvelope JSON — no MVP generate/answer API
- Deferred OpenAPI EvidenceEnvelope from earlier review — closed here (removed from deferred-work.md)

## Dev Agent Record

### Change Log

- 2026-07-15: Story created; implementation started
- 2026-07-15: OpenAPI EvidenceEnvelope + validate.mjs assertions; application runtime guard + tests; deferred item closed

### Files

- `packages/openapi/openapi.yaml` — EvidenceEnvelope schemas on retrieve 200
- `packages/openapi/scripts/validate.mjs` — contract assertions (no answer fields)
- `packages/application/src/retrieve/evidence-envelope.ts` — runtime guard
- `packages/application/src/retrieve/evidence-envelope.test.ts`
- `_bmad-output/implementation-artifacts/deferred-work.md`

### Tests

- `pnpm --filter @amkp/openapi test`
- `pnpm --filter @amkp/application test` (incl. evidence-envelope)
- `pnpm --filter @amkp/api test`
