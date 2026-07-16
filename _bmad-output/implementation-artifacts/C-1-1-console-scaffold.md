---
story_key: "C-1.1-console-scaffold"
status: ready-for-dev
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-1.1 — Scaffold AMKP Console app

## Goal

Create `apps/console` as the AMKP Console web app shell that will consume `@amkp/sdk-js`. Brand display name: **AMKP**.

## Acceptance criteria

1. **Given** the monorepo, **When** `pnpm --filter @amkp/console build` (or equivalent) runs, **Then** the Console package builds cleanly.
2. **Given** Console is started in dev, **When** user opens the root route, **Then** they see AMKP-branded shell (not a blank error) with placeholder nav for Admin / Workspace.
3. **Given** Console code, **When** inspected, **Then** it depends on `@amkp/sdk-js` and does not import `@amkp/adapters-postgres` or Prisma.
4. **Given** existing SDK/MCP/API packages, **When** Console is added, **Then** those packages remain unchanged in purpose (no removal).

## Tasks

1. Add `apps/console` to pnpm workspace (Vite+React or Next — prefer Vite SPA unless repo standard says otherwise; match Node 24 / TS strict).
2. Wire package name `@amkp/console`, scripts: `dev`, `build`, `typecheck`.
3. Root layout: AMKP wordmark, nav stubs (Admin, Workspace, Health), English copy — **Tailwind CSS v4** with theme tokens from `_bmad-output/D-Design-System/00-design-system.md` / `visual-direction.md` (Fraunces + DM Sans + IBM Plex Mono; warm stone canvas; teal Evidence accent). Theme in `apps/console/src/styles/index.css`.
4. README section in app: how to point at local API (`VITE_AMKP_BASE_URL` or similar); link WDS delivery DD-001 + design system.
5. Smoke test or Playwright placeholder optional; at minimum typecheck in CI path if easy.

## Out of scope

- Full auth (C-1.2)
- Real data screens (later epics)
