# AMKP Console — Design System (seed)

**Created:** 2026-07-16  
**Source:** `A-Product-Brief/visual-direction.md`  
**Grammar:** Claude-like Knowledge Studio × AMKP Evidence contract  
**Implementation:** Tailwind CSS v4 in `apps/console` — tokens live in `apps/console/src/styles/index.css` (`@theme`)

## Colors

| Token | Value | Role |
| --- | --- | --- |
| `color-canvas` | `#F7F6F3` | App background |
| `color-elevated` | `#FFFFFF` | Stream, composer, panels |
| `color-ink` | `#1A1917` | Primary text |
| `color-muted` | `#6B6560` | Meta |
| `color-line` | `#E5E2DC` | Borders |
| `color-teal` | `#0F766E` | Brand / Evidence / primary action |
| `color-teal-soft` | `#CCFBF1` | Active nav / soft fill |
| `color-working` | `#A16207` | Agent in progress |
| `color-working-soft` | `#FEF9C3` | Working wash |
| `color-cost` | `#C2410C` | CostEstimate |
| `color-cost-soft` | `#FFEDD5` | Cost pill wash |
| `color-ok` | `#15803D` | Parsed / success |
| `color-danger` | `#B91C1C` | Destructive / failed |

## Typography

| Token | Family | Size / weight |
| --- | --- | --- |
| `type-display` | Fraunces | 28–40 / 600 |
| `type-ui` | DM Sans | 15 / 400–600 |
| `type-label` | DM Sans | 13 / 500 |
| `type-mono` | IBM Plex Mono | 13 / 400 |

## Spacing scale

| Token | Value |
| --- | --- |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 32px |
| `space-7` | 48px |
| `space-sidebar` | 260px |
| `space-stream-max` | 760px |

## Radius

| Token | Value |
| --- | --- |
| `radius-sm` | 4px |
| `radius-md` | 8px |
| `radius-lg` | 12px |
| `radius-pill` | 9999px |

## Components (shared)

- **Shell** — left rail + top bar + AMKP wordmark + Tenant chip  
- **Composer** — bottom-anchored; attach; PreferCorrectness; ⌘Enter  
- **WorkingStep** — expandable hop/tool row  
- **EvidenceCard** — teal left bar; score; citation; snippet  
- **CostPill** — cost-soft / cost  
- **TenantChip** — ink-soft chip, always visible for Operator  
