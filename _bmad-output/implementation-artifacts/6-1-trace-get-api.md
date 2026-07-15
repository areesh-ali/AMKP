---
story_id: "6.1"
story_key: "6-1-trace-get-api"
ticket: "T-6.1"
epic: "6"
status: review
created: 2026-07-15
baseline_commit: "2a2c9c5"
fr: ["FR19"]
cap: ["CAP-6"]
depends_on: ["T-3.1"]
blocks: ["T-6.2", "T-4.4"]
---

# Story 6.1: Trace get API

Status: review

## Acceptance Criteria

1. **AC1** — GET Trace by request ID includes Tenant, router, Evidence IDs, CostEstimate, timestamps — ✅
2. **AC2** — Cross-Tenant access returns 403 — ✅

## Dev Agent Record

- Retrieve persists TraceRecord; `GET /v1/traces/:requestId`
- InMemoryTraceRepository MVP (Postgres persistence later)
