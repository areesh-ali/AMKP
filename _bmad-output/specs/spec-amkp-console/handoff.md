# Handoff — AMKP Console → agent-dev / loop

**Date:** 2026-07-16  
**Brand:** AMKP (locked)  
**Spec:** `_bmad-output/specs/spec-amkp-console/SPEC.md`  
**Plane contract (adopted):** `_bmad-output/specs/spec-amkp/SPEC.md`

## Instructions for Amelia / bmad-dev-auto

1. Implement Console as `apps/console` consuming `@amkp/sdk-js` only (no direct DB).
2. Do **not** remove or replace SDK, MCP, or OpenAPI.
3. Execute stories in order from `epics.md` in this folder.
4. First story: scaffold + session shell (CAP-1) — see implementation artifact.
5. Plane APIs already exist; prefer wiring UI to existing endpoints.
6. **Follow UX spines** — `ux-AMKP-2026-07-16/DESIGN.md` + `EXPERIENCE.md` + `ui-ideas.md` (P0 first). Tokens → CSS variables; Evidence-first Retrieve; Active Tenant always visible.

## Party outcome (closed)

- Name stays **AMKP**
- Console + SDK + MCP remain
- Enterprise better-RAG + agentic = plane promise under same brand
- Human product layer = AMKP Console (this SPEC)
