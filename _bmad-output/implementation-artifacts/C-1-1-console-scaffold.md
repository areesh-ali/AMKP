---
story_key: "C-1.1-console-scaffold"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-1.1 — Scaffold AMKP Console app

## Goal

Create `apps/console` as the AMKP Console web app shell that will consume `@amkp/sdk-js`. Brand display name: **AMKP**.

## Acceptance criteria

1. **Given** the monorepo, **When** `pnpm --filter @amkp/console build` runs, **Then** the Console package builds cleanly. ✅
2. **Given** Console is started in dev, **When** user opens the root route (authenticated), **Then** they see AMKP-branded shell with Admin / Workspace nav. ✅
3. **Given** Console code, **When** inspected, **Then** it depends on `@amkp/sdk-js` and does not import `@amkp/adapters-postgres` or Prisma. ✅
4. **Given** existing SDK/MCP/API packages, **When** Console is added, **Then** those packages remain unchanged in purpose. ✅

## Tasks

- [x] Add `apps/console` to pnpm workspace (Vite+React, Node 24 / TS strict)
- [x] Package `@amkp/console` with `dev`, `build`, `typecheck`, `test`
- [x] Tailwind v4 theme + Claude-feel shell
- [x] README with `VITE_AMKP_BASE_URL` + DD-001 links

## Dev Agent Record

**Completed:** 2026-07-20 — scaffold + Tailwind; session work continues in C-1.2/C-1.3
