---
story_id: "4.2"
story_key: "4-2-agentic-readiness-gate"
ticket: "T-4.2"
epic: "4"
status: review
created: 2026-07-15
baseline_commit: "23d9ba5"
fr: ["FR13"]
cap: ["CAP-4"]
depends_on: ["T-4.1"]
blocks: ["T-4.3"]
---

# Story 4.2: Agentic Readiness gate

Status: review

## Acceptance Criteria

1. **AC1** — Gate not passed + mode=agentic → 403 AGENTIC_READINESS_REQUIRED — ✅
2. **AC2** — Explicit override writes audit log with actor + timestamp — ✅

## Dev Agent Record

- `agenticReadinessPassed` on Tenant (default false)
- Override path: `agenticOverride=true` + `actor` → audit `agentic_override_enable`
