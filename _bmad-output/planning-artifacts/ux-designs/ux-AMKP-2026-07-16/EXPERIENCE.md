---
name: AMKP Console
status: final
sources:
  - ../../../specs/spec-amkp-console/SPEC.md
  - ../../../specs/spec-amkp-console/surfaces.md
updated: 2026-07-16
---

# AMKP Console — Experience Spine

Visual identity: `DESIGN.md`. Spines win on conflict with mockups.

## Foundation

Responsive **web** SPA (`apps/console`). Form factor: desktop-first ops console; usable at tablet width with stacked panes. UI tokens from `DESIGN.md`. Consumes plane only via `@amkp/sdk-js`. Brand: **AMKP**.

## Information Architecture

| Surface | Role | CAP | Reached from |
|---|---|---|---|
| Sign-in | Both | CAP-1 | App open (unauthenticated) |
| Shell | Both | CAP-1 | After session |
| Admin → Accounts & Tenants | Admin | CAP-2 | Sidebar |
| Admin → API keys | Admin | CAP-2 | Tenant row / sidebar |
| Admin → Audit | Admin | CAP-2 | Sidebar |
| Admin → Health & ops | Admin | CAP-8 | Sidebar |
| Workspace → Documents | Operator | CAP-3 | Sidebar |
| Workspace → Document detail | Operator | CAP-3 | Documents row |
| Workspace → Retrieve studio | Operator | CAP-4 | Sidebar / after ingest |
| Workspace → Traces | Operator | CAP-5 | Sidebar / from Retrieve result |
| Workspace → Eval | Operator | CAP-6 | Sidebar |
| Workspace → Tenant policy | Operator/Admin | CAP-7 | Sidebar |
| Onboarding guide | Developer | CAP-9 | First login / Help |

Global chrome: **AMKP** wordmark · role badge · **Active Tenant** chip · plane health dot · Help (SDK/MCP/docs links).

→ Mockups: `mockups/sign-in.html`, `mockups/documents.html`, `mockups/retrieve-studio.html`, `mockups/trace-inspector.html`.

## Voice and Tone

| Do | Don't |
|---|---|
| "Evidence returned — 4 items, $0.002 est." | "Here's your answer! ✨" |
| "Tenant `support` active" | "You're all set in your workspace" |
| "Parse failed — reparse or inspect Trace" | "Oops, something went wrong" |
| "Insufficient evidence under PreferCorrectness" | "I couldn't find that" |
| "Revoke key? Plane calls with this key will 401." | "Are you sure? 😊" |

## Component Patterns

| Pattern | Behavior |
|---|---|
| Active Tenant chip | Always visible for Operator. Switcher lists only authorized Tenants. Changing Tenant clears Retrieve draft query optionally with confirm if dirty. |
| Evidence list | Ranked cards; keyboard ↑↓ select; Enter opens citation detail; never auto-summarizes into a final answer. |
| Cost pill | Always adjacent to Retrieve envelope header. |
| Document status | Live badge; poll `waitForDocument` semantics without blocking whole page. |
| Confirm destructive | Modal: title, consequence, Cancel + destructive Confirm. |
| Trace hop timeline | Vertical steps; each hop shows reason + evidence IDs (mono). |

## State Patterns

| State | Treatment |
|---|---|
| Loading list | Skeleton rows matching table density |
| Empty Documents | Fraunces empty headline + Upload primary CTA |
| Empty Evidence | "No Evidence — try PreferCorrectness off or ingest more" |
| insufficient_evidence | First-class banner using warn tokens — not an error toast |
| Cross-Tenant deny | Inline error: "Not available for this Tenant" — no data bleed |
| Plane down | Top banner from health/ready; disable mutating actions |

## Interaction Primitives

- `⌘K` / `Ctrl+K` — jump to Documents, Retrieve, Traces, Tenants (Admin).
- Retrieve: `⌘Enter` submit query.
- Escape closes dialogs/switchers.
- Focus ring `{colors.focus-ring}` on all interactive controls.

## Accessibility Floor

- WCAG AA contrast on paper/ink and teal-on-teal-soft.
- All icon buttons have accessible names.
- Status not by color alone (text labels on badges).
- Trace timeline is a list with headings per hop.
- Reduce-motion: disable non-essential transitions.

## Key Flows

### Maya — Platform Admin stands up two Tenants (climax: keys issued)

1. Signs in as Platform Admin.
2. Creates Account "Acme".
3. Creates Tenants `support` and `billing`.
4. Issues API key for `support` — **climax:** plaintext key shown once with copy + “stored in session vault” note.
5. Opens Audit — sees create/issue events.

### Ken — Operator proves multimodal retrieve (climax: Evidence + cost)

1. Selects Active Tenant `support`.
2. Uploads table fixture; watches status → parsed.
3. Opens Retrieve studio; PreferCorrectness on.
4. Runs query — **climax:** Evidence cards with citations + cost pill; not a chat answer.
5. Opens Trace from requestId — sees single-pass router decision.

### Priya — Guided onboarding &lt;60m (climax: first Evidence)

1. Lands on Onboarding checklist.
2. Completes Admin path or uses provided Tenant.
3. Ingest → Retrieve — **climax:** success screen shows Evidence from her Document with link to SDK docs.

## Inspiration & Anti-patterns

**Inspired by:** Stripe Dashboard density + Linear keyboard feel + observability Trace timelines (Honeycomb-ish hops).

**Anti-patterns:** ChatGPT-home-as-product; Glean employee search feed; purple AI gradients; burying Tenant context; treating Console as replacement for SDK.

## UI ideas backlog (for design/dev)

See `ui-ideas.md` — prioritized concepts that map to CAPs without expanding non-goals.
