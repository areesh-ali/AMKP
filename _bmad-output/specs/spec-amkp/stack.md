# Stack (MVP)

Pinned from Architecture Spine AD-1…10. Implementation owns drift after code exists; spine/SPEC update required for SoR or topology changes.

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 24.18.0 LTS |
| Language | TypeScript 7.0.2 |
| API framework | NestJS 11.1.28 (hexagonal modular monolith) |
| ORM | Prisma 7.8.0 |
| SoR + vectors | PostgreSQL 16.x + pgvector |
| Cache / queue | Redis 7.x + BullMQ 5.80.2 |
| Observability | OpenTelemetry SDK Node 0.220.0 |
| MCP | `@modelcontextprotocol/sdk` 1.29.0 (Streamable HTTP adapter) |
| Package manager | pnpm monorepo |
| Topology | `apps/api` + `apps/worker` only; managed Postgres + Redis; single-region SaaS |
| Public SDK | TypeScript (`packages/sdk-js`) |
| Retrieve contract | Versioned `EvidenceEnvelope` JSON — no MVP generate/answer API |

## Deferred (not MVP blockers)

- Python parse/VLM worker sidecar
- Qdrant / dedicated vector DB
- Multi-region / VPC / K8s detail
- Exact embedding/VLM vendor SKUs (provider ports)
