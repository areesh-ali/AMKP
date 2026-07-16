# Design Log — AMKP

**Updated:** 2026-07-16

## Backlog

- [x] Approve Claude-like Knowledge Studio interaction principle (Evidence-first climax)
- [x] Phase 3: UX Scenarios — whole flows (Maya admin, Ken studio, Priya onboarding)
- [x] Phase 4: Page designs for all 14 scenario pages (`.design.md`)
- [ ] Phase 4 polish: deeper conceptual specs + prototype refinement
- [ ] Phase 5: Design delivery package for `apps/console`
- [x] Retire non-binding HTML mockups as design-of-record (keep as sketch archive only)

## Current

| Task | Owner | Started |
| --- | --- | --- |
| _(idle)_ Implement DD-001 in `apps/console` (Tailwind) | agent-dev | — |

## Design Loop Status

| Scenario | Page | Status | Updated |
| --- | --- | --- | --- |
| 01 Maya | 1.1–1.5 | designed | 2026-07-16 |
| 02 Ken Studio | 2.1–2.5 | designed + interactive prototype | 2026-07-16 |
| 03 Priya | 3.1–3.2 | designed | 2026-07-16 |
| 04 Ken Eval | 4.1–4.2 | designed | 2026-07-16 |

**Coverage:** 14/14 `.design.md` files

## Design intent

| Scenario | Intent |
| --- | --- |
| 01 Maya | Suggest — dense Admin |
| 02 Ken Studio | Dream — Claude grammar (UX bet) |
| 03 Priya | Suggest — runway |
| 04 Ken Eval | Suggest — report + policy |

## Log

- 2026-07-16 — Phase 3 complete (4 scenarios, 14 pages).
- 2026-07-16 — Phase 4 Dream/Suggest: all 14 page design specs written; Studio prototype at `02-kens-knowledge-studio/prototype-knowledge-studio.html`.
- 2026-07-16 — Loop wake #1 processed; re-armed (~120s) for polish/delivery next.
- 2026-07-16 — DD-001 packaged; `apps/console` scaffold uses **Tailwind CSS v4** (`@theme` tokens in `src/styles/index.css`). Build green.
- 2026-07-16 — Loop wake #2: Phase 4 page designs already complete (14/14); Tailwind migration done. **Loop stopped** (design pass finished). Next: implement DD-001 / TS-001 in Console.
