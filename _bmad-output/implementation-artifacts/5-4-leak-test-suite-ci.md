---
story_id: "5.4"
story_key: "5-4-leak-test-suite-ci"
ticket: "T-5.4"
epic: "5"
status: review
created: 2026-07-15
baseline_commit: "5525120"
fr: ["FR18"]
cap: ["CAP-5"]
depends_on: ["T-5.2", "T-5.3"]
blocks: []
---

# Story 5.4: Leak Test suite + CI

Status: review

## Acceptance Criteria

1. **AC1** — Planted A/B Documents; as A zero B content across Retrieve, cache warm, MCP — ✅
2. **AC2** — Suite runs in CI (`pnpm --filter @amkp/api test`) — ✅
3. **AC3** — Optional `AMKP_LEAK_ALERT_WEBHOOK` pages on failure — ✅

## Dev Agent Record

- `apps/api/src/mcp/leak-suite.integration.test.ts`
- CI workflow notes Leak suite coverage
