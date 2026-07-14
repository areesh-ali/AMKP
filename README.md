# AMKP

**Agentic Multimodal Knowledge Plane** — API/SDK/MCP-first Evidence + Policy + Tenancy plane.

Repo and product share the name **AMKP** (formerly workspace folder `RAG-Sol`).

## Contracts

| Artifact | Path |
| --- | --- |
| SPEC | [`_bmad-output/specs/spec-amkp/SPEC.md`](_bmad-output/specs/spec-amkp/SPEC.md) |
| Epics & tickets | [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) |
| Architecture spine | [`_bmad-output/planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md`](_bmad-output/planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md) |

## Monorepo layout

```text
apps/
  api/                 # NestJS HTTP (+ MCP later)
  worker/              # BullMQ consumers (parse, eval)
packages/
  domain/              # EvidenceEnvelope + entities
  application/         # use-cases / ports
  adapters-postgres/
  adapters-redis/
  adapters-providers/
  sdk-js/
  openapi/
infra/
  docker-compose.yml   # Postgres 16+pgvector, Redis 7
```

## Quick start

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm docker:up          # requires Docker
pnpm --filter @amkp/domain build
pnpm --filter @amkp/application build
pnpm --filter @amkp/adapters-redis build
pnpm dev:api            # http://localhost:3000/health
```

## First tickets

Sprint S1: **T-1.0** (this bootstrap) → **T-1.1** Account/Tenant APIs → **T-1.2** API keys → **T-5.1** namespace isolation → **T-2.1** ingest stub.
