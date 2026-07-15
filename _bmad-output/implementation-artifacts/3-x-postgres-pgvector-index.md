---
story_id: "3.x"
story_key: "3-x-postgres-pgvector-index"
ticket: "T-3.x-pgvector"
epic: "3"
status: done
created: 2026-07-15
---

# Story: Postgres + pgvector shared vector index

Status: done

## Story

As a Platform Engineer,
I want API and Worker to share a Postgres+pgvector index,
so that parse-indexed chunks are retrievable across processes (AD-3).

## Acceptance Criteria

1. **AC1** — `PostgresVectorIndex` upserts embeddings into `vector_chunks` with Tenant namespace — PASS
2. **AC2** — Search is namespace-scoped (no cross-Tenant hits) — PASS
3. **AC3** — Worker defaults to Postgres index; tests keep `InMemoryVectorIndex` via `AMKP_JOB_QUEUE=memory` / `AMKP_VECTOR_INDEX=memory` — PASS
4. **AC4** — OpenAPI documents MCP, traces, eval, metrics, and retrieve `mode` — PASS

## Tasks / Subtasks

- [x] Migration + Prisma `VectorChunk` model (`vector(64)`)
- [x] Stub embedding + hybrid lexical/dense scoring
- [x] Wire PersistenceModule + Worker
- [x] Unit + integration tests
- [x] OpenAPI path sync for post-MVP surfaces
