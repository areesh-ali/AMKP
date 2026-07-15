# AMKP POC Pack

Self-serve bake-off pack for new Accounts — no sales gate (FR-23 / T-7.3).

## What's included

| Asset | Path / endpoint | Purpose |
| --- | --- | --- |
| Golden questions fixture | `packages/application/fixtures/poc/golden-questions.json` | Eval inputs |
| Multimodal table fixture | `packages/application/fixtures/poc/multimodal-table.md` | TableEvidence ingest |
| Leak / ACL suite | `apps/api/src/mcp/leak-suite.integration.test.ts` | Isolation pass criteria |
| Golden eval API | `POST /v1/eval/golden-set` | Machine-readable outcomes |
| TableRank ablation API | `POST /v1/eval/table-rank` | Multimodal vs text-only |

## Pass criteria (documented)

1. **Isolation** — Leak suite green: Tenant A never sees Tenant B content across Retrieve, cache warm, and MCP.
2. **Golden eval** — ≥80% of POC golden questions `passed: true` for the seeded Tenant corpus.
3. **TableRank** — `summary.avgLift > 0` on the multimodal table fixture query set.

## Happy path (<60 minutes)

1. Create Account + Tenant (admin) → copy API key.
2. `POST /v1/ingest` with `fixtures/poc/multimodal-table.md`.
3. Wait for parse (or run worker locally).
4. `POST /v1/eval/golden-set` with `fixtures/poc/golden-questions.json`.
5. `POST /v1/eval/table-rank` with queries from the fixture README.
6. Run `pnpm --filter @amkp/api test -- src/mcp/leak-suite.integration.test.ts`.

## Script

```bash
pnpm --filter @amkp/application exec node ./fixtures/poc/print-pack.mjs
```
