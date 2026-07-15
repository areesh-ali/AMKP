---
story_id: "3.4"
story_key: "3-4-cost-estimate-on-response"
ticket: "T-3.4"
epic: "3"
status: review
created: 2026-07-15
baseline_commit: "17a6b82"
fr: ["FR11"]
cap: ["CAP-3"]
depends_on: ["T-3.3"]
blocks: ["T-3.5"]
---

# Story 3.4: CostEstimate on response

Status: review

## Story

As a Platform Admin,
I want CostEstimate on every Retrieve,
so that spend is visible per request.

## Acceptance Criteria

1. **AC1** — Every Retrieve response includes CostEstimate — ✅
2. **AC2** — Cache hit reports estimatedUsd 0 — ✅
3. **AC3** — Live search reports non-negative stub estimate — ✅

## Spec sync

- FR11 / NFR7: CostEstimate always present; may be 0 on cache hit

## Dev Agent Record

### Change Log

- 2026-07-15: `buildRetrieveCostEstimate` + RetrieveUseCase wiring; unit tests
