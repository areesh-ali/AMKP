# AMKP Console — UX sketch archive (non-binding)

**Date:** 2026-07-16  
**Status:** **Superseded as design-of-record** by WDS fast-path:

- `_bmad-output/A-Product-Brief/` (incl. `visual-direction.md` — Claude-like Knowledge Studio)
- `_bmad-output/B-Trigger-Map/`
- `_bmad-output/_progress/00-design-log.md`

HTML mockups here are **sketch archive only**. Binding UX follows Freya Phase 3→5 (scenarios → pages → specs → delivery).

**Spec:** `_bmad-output/specs/spec-amkp-console/SPEC.md`

| Artifact | Role |
| --- | --- |
| [`DESIGN.md`](./DESIGN.md) | Visual identity, tokens, components, do/don't |
| [`EXPERIENCE.md`](./EXPERIENCE.md) | IA, voice, states, a11y, key journeys |
| [`ui-ideas.md`](./ui-ideas.md) | P0–P2 UI concepts mapped to CAPs |
| [`mockups/`](./mockups/) | Key-screen HTML previews |

## Mockups

Open locally in a browser:

1. [Sign-in](./mockups/sign-in.html) — CAP-1 · brand hero
2. [Documents](./mockups/documents.html) — CAP-3 · workspace shell
3. [Retrieve studio](./mockups/retrieve-studio.html) — CAP-4 · Evidence-first
4. [Trace inspector](./mockups/trace-inspector.html) — CAP-5 · hop timeline

Or use [`mockups/index.html`](./mockups/index.html) as a gallery.

## Implementers

- Consume tokens from `DESIGN.md` as CSS variables in `apps/console`.
- Do not invent chat-as-primary Retrieve UX.
- Keep Active Tenant chrome visible whenever Operator APIs can fire.
- SDK / MCP / OpenAPI remain linked from Help — Console does not replace them.
