# AMKP

**Agentic Multimodal Knowledge Plane** — an API / SDK / MCP-first **Evidence + Policy + Tenancy** plane that multiple products share.

Platform teams ingest multimodal documents once, retrieve typed Evidence under hard Tenant isolation, and optionally run Guarded Agentic Retrieval with budgets and traces — without rebuilding a RAG stack per product and without a workforce search UI.

## About (GitHub)

Use this for the repository **About** panel:

| Field | Value |
| --- | --- |
| **Description** | AMKP — Agentic Multimodal Knowledge Plane. API/SDK/MCP-first Evidence + Policy + Tenancy for multi-product RAG: hard tenant isolation, structure-aware ingest, guarded agentic retrieve, eval/POC. |
| **Website** | _(none yet — local docs: `design-artifacts/amkp-html-docs/index.html`)_ |
| **Topics** | `amkp` `rag` `multimodal` `multi-tenant` `mcp` `nestjs` `pgvector` `knowledge-plane` `agentic-retrieval` `typescript` |

**Short blurb (≤350 chars, paste into GitHub Description):**

```text
AMKP (Agentic Multimodal Knowledge Plane): API/SDK/MCP-first Evidence + Policy + Tenancy plane for multi-product RAG — hard isolation, Parse Ladder / TableEvidence, guarded agentic retrieve, traces & eval.
```

| | |
| --- | --- |
| **Product** | AMKP |
| **Repo** | `AMKP` (`package.json` → `amkp`) |
| **Stack** | NestJS hexagonal monorepo · Postgres 16 + pgvector · Redis 7 · BullMQ |
| **Status** | Bootstrap (Story **T-1.0**). Health endpoint only; Account/Tenant APIs are next. |

---

## Prerequisites

- **Node.js** ≥ 24.18 (LTS)
- **pnpm** 9.15.9 via Corepack
- **Docker** + Docker Compose (Postgres + Redis)

```bash
node -v          # expect v24.x
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm -v
docker -v
```

---

## How to run

### 1. Install

```bash
cd /path/to/AMKP
pnpm install
cp .env.example .env   # optional local overrides
```

### 2. Start infrastructure

```bash
pnpm docker:up
```

Starts:

| Service | Image | Port | Credentials |
| --- | --- | --- | --- |
| Postgres + pgvector | `pgvector/pgvector:pg16` | `5433` | user/pass/db: `amkp` |
| Redis | `redis:7-alpine` | `6379` | — |

Stop with `pnpm docker:down`.

### 3. Build workspace packages

Shared packages must build before apps that depend on them (first time, or after domain/application changes):

```bash
pnpm --filter @amkp/domain build
pnpm --filter @amkp/application build
pnpm --filter @amkp/adapters-redis build
pnpm --filter @amkp/adapters-postgres build
pnpm --filter @amkp/adapters-providers build
pnpm --filter @amkp/sdk-js build
# or everything:
pnpm build
```

### 4. Run API (dev)

```bash
pnpm dev:api
```

Smoke check:

```bash
curl -s http://localhost:3000/health
# → {"ok":true,"service":"api"}
```

### 5. Run worker (dev)

```bash
pnpm dev:worker
```

Currently a process stub that logs BullMQ queue names (`ingest`, `parse`, `eval`). Real consumers land in **T-2.1** / **T-7.1**.

### Useful scripts

| Script | What it does |
| --- | --- |
| `pnpm install` | Install all workspace deps |
| `pnpm docker:up` / `docker:down` | Start/stop Postgres + Redis |
| `pnpm build` | Build all packages/apps |
| `pnpm dev:api` | Nest API with hot reload (`tsx watch`) |
| `pnpm dev:worker` | Worker process with hot reload |
| `pnpm typecheck` | Typecheck all workspaces |
| `pnpm test` | Run package tests (stubs until stories land) |

### Env vars (`.env.example`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | API listen port |
| `DATABASE_URL` | `postgresql://amkp:amkp@localhost:5433/amkp` | Postgres |
| `REDIS_URL` | `redis://localhost:6379` | Redis / BullMQ |
| `NODE_ENV` | `development` | Runtime mode |

---

## Repository layout

```text
AMKP/
├── apps/
│   ├── api/                 # NestJS HTTP (+ MCP later)
│   └── worker/              # BullMQ consumers (parse, eval)
├── packages/
│   ├── domain/              # EvidenceEnvelope + entities
│   ├── application/         # use-cases / ports (TenantContext)
│   ├── adapters-postgres/   # SoR + pgvector (stub → T-1.1 / T-5.1)
│   ├── adapters-redis/      # cache + queue names
│   ├── adapters-providers/  # embeddings / VLM ports
│   ├── sdk-js/              # official TypeScript SDK (T-8.2)
│   └── openapi/             # OpenAPI seed (T-8.1)
├── infra/
│   └── docker-compose.yml
├── design-artifacts/
│   └── amkp-html-docs/      # browsable product/UX HTML hub
├── _bmad-output/            # planning + SPEC + tickets (see below)
├── docs/                    # project knowledge (reserved)
└── README.md
```

Dependency rule (Architecture AD-1): **adapters → application → domain**. Domain never imports adapters. REST and MCP call the same application services.

---

## Documentation map (Markdown)

Read in this order if you’re new:

```text
Market research → Brief → PRD → SPEC → Architecture → Epics
```

### Canonical build contracts (start here)

| File | What it is |
| --- | --- |
| [`_bmad-output/specs/spec-amkp/SPEC.md`](_bmad-output/specs/spec-amkp/SPEC.md) | **Machine contract.** Why, CAP-1–8 (intent + success), constraints, non-goals, success signal. Downstream skills and implementers treat this as source of truth. |
| [`_bmad-output/specs/spec-amkp/glossary.md`](_bmad-output/specs/spec-amkp/glossary.md) | Binding terms: Account, Tenant, Evidence, Parse Ladder, Leak Test, etc. |
| [`_bmad-output/specs/spec-amkp/fr-map.md`](_bmad-output/specs/spec-amkp/fr-map.md) | PRD FR-1–27 → CAP-1–8 and success metrics. |
| [`_bmad-output/specs/spec-amkp/failure-modes.md`](_bmad-output/specs/spec-amkp/failure-modes.md) | Expected failure / edge behaviors to test against. |
| [`_bmad-output/specs/spec-amkp/stack.md`](_bmad-output/specs/spec-amkp/stack.md) | Pinned MVP stack and deferred tech (Python sidecar, Qdrant, VPC). |
| [`_bmad-output/planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md`](_bmad-output/planning-artifacts/architecture/architecture-RAG-Sol-2026-07-14/ARCHITECTURE-SPINE.md) | **Architecture spine.** Paradigm, AD-1–AD-10, conventions, structural seed. |
| [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) | **Backlog.** FR/NFR/UX inventory, FR coverage map, epics E1–E8, stories **T-1.0…T-8.4**, sprint slices S1–S6. |

### Product planning (narrative upstream)

| File | What it is |
| --- | --- |
| [`_bmad-output/planning-artifacts/research/market-agentic-multimodal-rag-multi-product-research-2026-07-14.md`](_bmad-output/planning-artifacts/research/market-agentic-multimodal-rag-multi-product-research-2026-07-14.md) | Market research that justified the AMKP wedge (tenancy, multimodal, guarded agentic, eval DX). |
| [`_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/brief.md`](_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/brief.md) | Product brief — problem, ICP, positioning. |
| [`_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/addendum.md`](_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/addendum.md) | Brief addendum / parking-lot notes. |
| [`_bmad-output/planning-artifacts/prds/prd-RAG-Sol-2026-07-14/prd.md`](_bmad-output/planning-artifacts/prds/prd-RAG-Sol-2026-07-14/prd.md) | Full PRD — FR-1–27, UJ-1–3, NFRs, non-goals, success metrics. |
| [`_bmad-output/planning-artifacts/prds/prd-RAG-Sol-2026-07-14/addendum.md`](_bmad-output/planning-artifacts/prds/prd-RAG-Sol-2026-07-14/addendum.md) | PRD addendum. |

### Ideation

| File | What it is |
| --- | --- |
| [`_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/brainstorm-intent.md`](_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/brainstorm-intent.md) | Brainstorm goal and locked wedge intent. |
| [`_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/brainstorm.html`](_bmad-output/brainstorming/brainstorm-amkp-rag-product-ideas-2026-07-14/brainstorm.html) | Interactive brainstorm board (open in a browser). |

### Pointers / process logs

| File | What it is |
| --- | --- |
| [`_bmad-output/implementation-artifacts/amkp-epics-and-tickets.md`](_bmad-output/implementation-artifacts/amkp-epics-and-tickets.md) | **Superseded.** Points at canonical [`epics.md`](_bmad-output/planning-artifacts/epics.md). |
| `**/.memlog.md` | Append-only decision logs for BMad runs (not hand-edited product docs). |

> Folder names under `_bmad-output/.../architecture-RAG-Sol-*` and `prd-RAG-Sol-*` are historical path slugs from before the repo rename. Content is AMKP.

---

## HTML docs hub

Open in a browser (no build step):

[`design-artifacts/amkp-html-docs/index.html`](design-artifacts/amkp-html-docs/index.html)

| Page | Contents |
| --- | --- |
| `index.html` | Hub links |
| `product-overview.html` | Product narrative |
| `ux-journeys.html` | UJ-1 Maya · UJ-2 Ken · UJ-3 Priya (DX surfaces) |
| `requirements-map.html` | FR / CAP map |
| Architecture walkthrough | Linked from hub → `_bmad-output/.../architecture-walkthrough.html` |

---

## What exists today vs next

| Ready now | Next (Sprint S1) |
| --- | --- |
| pnpm monorepo + Nest `/health` | **T-1.1** Account & Tenant APIs |
| Domain `EvidenceEnvelope` types | **T-1.2** Tenant-bound API keys |
| Worker process stub + queue names | **T-1.3** Auth integration tests |
| Compose Postgres/Redis | **T-5.1** Namespace-per-Tenant indexing |
| SPEC + epics + architecture | **T-2.1** Ingest API + async jobs |

Build order: **E1 → E2 → E3 → E5 (isolation early) → E4 → E6 → E7 → E8**. Full acceptance criteria live in [`epics.md`](_bmad-output/planning-artifacts/epics.md).

---

## Non-goals (MVP)

Do not build these into early tickets:

- Glean-class workforce search UI
- Generate/answer API as primary contract (BYO LLM)
- Connector marketplace, VPC/air-gap appliance
- Unbounded agent loops without budgets/traces

See SPEC Non-goals and PRD §5 for the full list.
