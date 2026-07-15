---
story_id: "5.3"
story_key: "5-3-mcp-tenant-binding"
ticket: "T-5.3"
epic: "5"
status: review
created: 2026-07-15
baseline_commit: "5525120"
fr: ["FR17"]
cap: ["CAP-5"]
depends_on: ["T-5.1", "T-3.1"]
blocks: ["T-5.4", "T-8.3"]
---

# Story 5.3: MCP Tenant binding

Status: review

## Acceptance Criteria

1. **AC1** — MCP connected as Tenant A; planted B Document IDs → empty, never B content — ✅
2. **AC2** — Product tool manifest has no admin tools — ✅
3. **AC3** — Tenant override in tool params → 403 — ✅

## Dev Agent Record

- Thin MCP facade over RetrieveUseCase (AD-6)
- `GET /v1/mcp/tools`, `POST /v1/mcp/tools/retrieve`
