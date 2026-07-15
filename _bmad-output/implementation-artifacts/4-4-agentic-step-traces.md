---
story_id: "4.4"
story_key: "4-4-agentic-step-traces"
ticket: "T-4.4"
epic: "4"
status: review
created: 2026-07-15
baseline_commit: "8250802"
fr: ["FR15"]
cap: ["CAP-4", "CAP-6"]
depends_on: ["T-4.3", "T-6.1"]
blocks: []
---

# Story 4.4: Agentic step Traces

Status: review

## Acceptance Criteria

1. **AC1** — Each hop recorded with tool/query, Evidence IDs, incremental CostEstimate — ✅
2. **AC2** — Trace API returns ordered steps — ✅

## Dev Agent Record

- `TraceHopStep[]` on TraceRecord; populated by `runAgenticRetrieve`
