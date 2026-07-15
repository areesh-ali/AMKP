# AMKP MCP retrieve

Thin MCP facade over the same Retrieve use case as REST (Architecture AD-6).

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/v1/mcp/tools` | Tenant API key |
| POST | `/v1/mcp/tools/retrieve` | Tenant API key |

Product credentials see **retrieve only** — no admin tools.

## Cursor / Claude Desktop

1. Provision a Tenant API key.
2. Point your MCP HTTP bridge at `http://localhost:3000/v1/mcp` with `Authorization: Bearer <apiKey>`.
3. Call tool `retrieve` with `{ "query": "..." }`.

Isolation (FR-17): planted cross-Tenant Document IDs return empty Evidence; body `tenantId` overrides are rejected with 403.

See also: Leak suite in CI (`apps/api/src/mcp/leak-suite.integration.test.ts`).
