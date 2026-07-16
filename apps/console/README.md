# AMKP Console

Human product layer for the AMKP enterprise knowledge plane. Brand: **AMKP**. Consumes the plane only via `@amkp/sdk-js`.

## Stack

- Vite + React 19 + TypeScript strict
- **Tailwind CSS v4** (`@tailwindcss/vite`) — theme tokens in `src/styles/index.css`
- React Router

## Design

Binding UX (WDS):

- `_bmad-output/A-Product-Brief/visual-direction.md`
- `_bmad-output/D-Design-System/00-design-system.md`
- `_bmad-output/deliveries/DD-001-knowledge-studio.yaml`
- Interactive prototype: `_bmad-output/C-UX-Scenarios/02-kens-knowledge-studio/prototype-knowledge-studio.html`

Theme colors/fonts map 1:1 into Tailwind `@theme` (e.g. `bg-canvas`, `text-teal`, `font-display`).

## Dev

```bash
# from repo root
pnpm install
pnpm --filter @amkp/sdk-js build
pnpm --filter @amkp/console dev
```

```bash
# .env.local (optional)
VITE_AMKP_BASE_URL=http://127.0.0.1:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` | Vite + Tailwind (port 5173) |
| `build` | Typecheck + production bundle |
| `typecheck` | `tsc --noEmit` |

## Non-goals

Does not replace SDK, MCP, or OpenAPI. Retrieve UX is Evidence-first (Claude shell, not chat-as-primary).
