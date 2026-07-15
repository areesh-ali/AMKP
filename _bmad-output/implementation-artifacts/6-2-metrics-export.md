---
story_id: "6.2"
story_key: "6-2-metrics-export"
ticket: "T-6.2"
epic: "6"
status: review
created: 2026-07-15
baseline_commit: "a9296a1"
fr: ["FR20"]
cap: ["CAP-6"]
depends_on: ["T-6.1"]
blocks: []
---

# Story 6.2: Metrics export

Status: review

## Acceptance Criteria

1. **AC1** — `GET /metrics` Prometheus text with tenant_id labels for retrieve latency, errors, agentic hops, CostEstimate — ✅

## Dev Agent Record

- `InMemoryMetrics` + scrape controller; retrieve controller observes
