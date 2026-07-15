---
story_id: "8.3"
story_key: "8-3-mcp-retrieve-server"
ticket: "T-8.3"
epic: "8"
status: review
created: 2026-07-15
baseline_commit: "fdfb696"
fr: ["FR26", "FR17"]
cap: ["CAP-8"]
depends_on: ["T-5.3"]
blocks: []
---

# Story 8.3: MCP retrieve server

Status: review

## Acceptance Criteria

1. **AC1** — Documented MCP connect path for a reference client — ✅ `docs/mcp.md`
2. **AC2** — FR17 isolation applies (Tenant from auth) — ✅ T-5.3 facade

## Connect (Cursor / HTTP tools)

AMKP exposes a thin Streamable-HTTP-style MCP facade:

- `GET /v1/mcp/tools` — product tool manifest (`retrieve` only)
- `POST /v1/mcp/tools/retrieve` — EvidenceEnvelope; Bearer Tenant API key

Example Cursor MCP config (HTTP tools adapter / custom):

```json
{
  "mcpServers": {
    "amkp": {
      "url": "http://localhost:3000/v1/mcp",
      "headers": {
        "Authorization": "Bearer ${AMKP_API_KEY}"
      }
    }
  }
}
```

Use the Tenant API key from Account provisioning. Tool params cannot select another Tenant.
