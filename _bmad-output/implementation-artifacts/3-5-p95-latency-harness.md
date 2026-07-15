---
story_id: "3.5"
story_key: "3-5-p95-latency-harness"
ticket: "T-3.5"
epic: "3"
status: review
created: 2026-07-15
baseline_commit: "17a6b82"
fr: []
cap: ["CAP-3"]
depends_on: ["T-3.4"]
blocks: []
nfr: ["NFR latency ≤800ms p95 ex-LLM"]
---

# Story 3.5: p95 latency budget harness

Status: review

## Story

As a platform engineer,
I want a load harness for single-pass p95,
so that we track ≤800ms ex-LLM at agreed corpus size.

## Acceptance Criteria

1. **AC1** — Harness runs against agreed corpus fixture (200 chunks)
2. **AC2** — Report includes p95 latency excluding customer LLM time
3. **AC3** — Soft budget ≤800ms p95

## Dev Agent Record

### Change Log

- 2026-07-15: `latency-p95.harness.test.ts` + JSON report artifact; `pnpm --filter @amkp/application harness:p95`
