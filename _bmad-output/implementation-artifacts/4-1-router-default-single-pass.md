---
story_id: "4.1"
story_key: "4-1-router-default-single-pass"
ticket: "T-4.1"
epic: "4"
status: review
created: 2026-07-15
baseline_commit: "d75b0c9"
fr: ["FR12"]
cap: ["CAP-4"]
depends_on: ["T-6.1"]
blocks: ["T-4.2"]
---

# Story 4.1: Router default single-pass

Status: review

## Acceptance Criteria

1. **AC1** — New Tenant Retrieve path is single-pass — ✅ `tenant_default_single_pass`
2. **AC2** — Trace records router decision + reason code — ✅
3. **AC3** — `mode=agentic` without enable → 403 AGENTIC_NOT_ENABLED — ✅

## Dev Agent Record

- `decideRetrieveRoute` in application/agentic
- Wired into RetrieveUseCase + Trace
