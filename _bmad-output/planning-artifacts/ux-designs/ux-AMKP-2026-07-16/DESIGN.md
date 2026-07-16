---
name: AMKP
description: Enterprise knowledge plane Console — Evidence-first ops for better RAG and guarded agentic.
status: final
updated: 2026-07-16
colors:
  ink: '#0B1220'
  ink-soft: '#1A2332'
  paper: '#F5F7FA'
  paper-elevated: '#FFFFFF'
  line: '#D5DCE6'
  muted: '#5C6B7A'
  teal: '#0F766E'
  teal-soft: '#CCFBF1'
  teal-foreground: '#F0FDFA'
  signal: '#C2410C'
  signal-soft: '#FFEDD5'
  ok: '#15803D'
  warn: '#A16207'
  danger: '#B91C1C'
  focus-ring: '#0F766E'
typography:
  display:
    fontFamily: 'Fraunces'
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.15'
    letterSpacing: '-0.02em'
  display-sm:
    fontFamily: 'Fraunces'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '-0.015em'
  title:
    fontFamily: 'DM Sans'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'DM Sans'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  label:
    fontFamily: 'DM Sans'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0.01em'
  mono:
    fontFamily: 'IBM Plex Mono'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.45'
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter: 24px
  sidebar: 240px
  content-max: 1200px
components:
  button-primary:
    background: '{colors.teal}'
    foreground: '{colors.teal-foreground}'
    radius: '{rounded.md}'
  button-secondary:
    background: '{colors.paper-elevated}'
    foreground: '{colors.ink}'
    border: '{colors.line}'
    radius: '{rounded.md}'
  button-danger:
    background: '{colors.danger}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  nav-active:
    background: '{colors.teal-soft}'
    foreground: '{colors.teal}'
    radius: '{rounded.sm}'
  evidence-card:
    background: '{colors.paper-elevated}'
    border: '{colors.line}'
    accent: '{colors.teal}'
    radius: '{rounded.md}'
  tenant-chip:
    background: '{colors.ink-soft}'
    foreground: '#E8EEF5'
    radius: '{rounded.sm}'
  cost-pill:
    background: '{colors.signal-soft}'
    foreground: '{colors.signal}'
    radius: '{rounded.full}'
  status-parsed:
    background: '#DCFCE7'
    foreground: '{colors.ok}'
  status-pending:
    background: '#FEF9C3'
    foreground: '{colors.warn}'
  status-failed:
    background: '#FEE2E2'
    foreground: '{colors.danger}'
---

## Brand & Style

AMKP is an **enterprise knowledge plane**: better RAG under products, hard tenancy, multimodal fidelity, guarded agentic. Console is the human product layer — precise, calm, and Evidence-forward. The brand should feel like a **cartographer’s desk for machine knowledge**: ink, paper, measured lines, one teal signal for “this is grounded Evidence.”

Not a chat toy. Not a purple AI dashboard. Not a newspaper layout. Wordmark **AMKP** is the hero identity on every shell; secondary chrome stays quiet.

## Colors

- **Ink (`{colors.ink}`)** — primary text, shell chrome edges, Active Tenant emphasis.
- **Paper (`{colors.paper}`)** — app canvas; cool gray-white, not cream.
- **Elevated (`{colors.paper-elevated}`)** — panels, cards, dialogs.
- **Teal (`{colors.teal}`)** — brand action + Evidence accent. Primary buttons, active nav, citation markers, focus ring.
- **Signal (`{colors.signal}`)** — cost / PreferCorrectness tension only. Never decorative.
- **OK / Warn / Danger** — Document and job status only.

Avoid: purple gradients, neon glows, multi-accent rainbows, warm cream paper.

## Typography

- **Fraunces** — display only: sign-in hero, empty-state headlines, onboarding climax.
- **DM Sans** — UI chrome, body, titles, labels.
- **IBM Plex Mono** — request IDs, document IDs, hashes, JSON snippets, Trace step IDs.

Never use Inter, Roboto, Arial, or system-ui as the designed stack.

## Layout & Spacing

App shell: fixed left sidebar `{spacing.sidebar}` + top bar with **AMKP** wordmark left and **Active Tenant** chip right. Content max `{spacing.content-max}`, gutter `{spacing.gutter}`. Dense tables allowed on Admin/Documents; Retrieve studio uses a split pane (query | Evidence).

Breakpoints: `sm` < 768 stack sidebar to sheet; `md` icon rail; `lg+` full sidebar.

## Elevation & Depth

Prefer **border + tonal shift** over heavy shadows. One soft shadow on dialogs only (`0 8px 24px rgba(11,18,32,0.08)`). Evidence cards: 1px `{colors.line}` + 3px left bar `{colors.teal}`.

## Shapes

`{rounded.md}` default for controls and cards. `{rounded.sm}` for chips/nav. Avoid `full` pills except cost/status pills.

## Components

| Component | Spec |
|---|---|
| **Shell** | Sidebar + top bar; AMKP wordmark uses `{typography.display-sm}` at 22px equivalent. |
| **Active Tenant chip** | `{components.tenant-chip}`; always visible for Operator; click opens switcher. |
| **Evidence card** | `{components.evidence-card}`; shows score, citation Document ID (mono), snippet, location. |
| **Cost pill** | `{components.cost-pill}` beside every Retrieve result header. |
| **Status badge** | parsed / pending / failed tokens above. |
| **Primary button** | `{components.button-primary}` — teal fill. |
| **Destructive** | Confirm dialog required; `{components.button-danger}` only inside confirm. |

## Do's and Don'ts

**Do**

- Lead with **AMKP** identity on first viewport of sign-in and shell.
- Show Evidence + cost before any “answer” metaphor.
- Keep Active Tenant visible whenever Operator APIs can fire.

**Don't**

- Present free-form chat as the primary Retrieve result.
- Hide Tenant context in a buried settings menu.
- Use purple AI aesthetics or decorative glow.
- Drop SDK/MCP links — DX kit stays linked from Help / Docs.
