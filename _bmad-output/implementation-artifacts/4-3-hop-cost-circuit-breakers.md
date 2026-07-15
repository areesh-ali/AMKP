---
story_id: "4.3"
story_key: "4-3-hop-cost-circuit-breakers"
ticket: "T-4.3"
epic: "4"
status: review
created: 2026-07-15
baseline_commit: "52248b8"
fr: ["FR14"]
cap: ["CAP-4"]
depends_on: ["T-4.2"]
blocks: ["T-4.4"]
---

# Story 4.3: Hop & cost circuit breakers

Status: review

## Acceptance Criteria

1. **AC1** — Max hops (default 3) → termination_reason hop_budget — ✅
2. **AC2** — Cost circuit breaker → cost_budget with partial Evidence — ✅
3. **AC3** — Tenant fields agenticMaxHops / agenticMaxCostUsd — ✅

## Dev Agent Record

- `runAgenticRetrieve` loop; budgets on Tenant
