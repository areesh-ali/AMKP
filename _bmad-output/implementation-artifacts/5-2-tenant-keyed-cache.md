---
story_id: "5.2"
story_key: "5-2-tenant-keyed-cache"
ticket: "T-5.2"
epic: "5"
status: review
created: 2026-07-15
baseline_commit: "17a6b82"
fr: ["FR16"]
cap: ["CAP-5"]
depends_on: ["T-5.1", "T-3.4"]
blocks: ["T-5.4"]
---

# Story 5.2: Tenant-keyed cache

Status: review

## Story

As a platform engineer,
I want cache keys to include tenant_id,
so that cross-Tenant cache hits are impossible.

## Acceptance Criteria

1. **AC1** — Cache keys include tenant_id — ✅ `tenant:{id}|...`
2. **AC2** — Warmed Tenant A cache never serves A content to Tenant B — ✅ integration test

## Spec sync

- FR16 hard Tenant isolation; cache keys include tenant_id
- FR11 cache hit CostEstimate may be 0
- PreferCorrectness threshold is part of the key to avoid stale refusals

## Dev Agent Record

### Change Log

- 2026-07-15: `InMemoryTenantRetrieveCache` + Nest wiring + cache-isolation integration test
