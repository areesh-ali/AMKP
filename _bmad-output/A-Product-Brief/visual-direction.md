# Visual Direction: AMKP Console

> Brand aesthetics & interaction grammar

**Created:** 2026-07-16  
**Author:** areesh  
**Related:** [Product Brief](./product-brief.md)

---

## Existing Brand Assets

| Asset | Status | Location |
| --- | --- | --- |
| Wordmark **AMKP** | Locked | SPEC + shell |
| Prior DESIGN tokens | Superseded for Operator home | `ux-AMKP-2026-07-16/DESIGN.md` (ops density retained for Admin) |
| Plane identity | Locked | Enterprise knowledge plane |

### Brand Constraints

- Display name **AMKP**; product chrome **AMKP Console**  
- Not purple-AI glow dashboard  
- Not Glean-style workforce feed  
- SDK/MCP links remain in Help  

---

## Visual References

### Inspiration Sites

**[Claude.ai](https://claude.ai)**  
- What we like: composer-centered calm; thread rail; file attach; streaming; expandable “working” / tool steps; artifact side panel; soft surfaces; almost no dashboard chrome  
- Relevance: **primary interaction grammar** for Knowledge Studio  

**Stripe Dashboard** (Admin only)  
- What we like: dense trustworthy tables for keys/tenants  
- Relevance: Admin / Health / Audit — not the Operator home  

**Honeycomb / observability traces**  
- What we like: hop timelines as narrative  
- Relevance: map onto Claude-style expandable agent steps  

### Visual Mood

Quiet confidence. Soft light. Space to think. The agent is busy; the UI never shouts.

**Keywords:** calm · spacious · stone · soft ink · Evidence teal · composer · artifacts · working  

---

## Design Style

### UI Style

**Primary Style:** Conversational studio (Claude-like) + secondary ops density

**Characteristics:**

- Centered max-width stream (~720–800px) over soft canvas  
- Left rail ~260px: threads, Documents shortcut, Tenant chip  
- Bottom-anchored composer with attach + PreferCorrectness + mode  
- Agent turns: working chips → Evidence artifact cards  
- Admin routes: denser tables, still soft paper  

### Design Aesthetic

**Aesthetic:** Warm-calm enterprise (Claude grammar × AMKP identity)

Not: neon, purple gradients, multi-shadow cards-as-decoration, chat-bubble cartooning.

---

## Color Direction

| Role | Direction | Notes |
| --- | --- | --- |
| Canvas | Warm stone / soft paper `#F7F6F3` | Claude-adjacent calm |
| Elevated | `#FFFFFF` | Stream cards, composer |
| Ink | Soft black `#1A1917` | Body |
| Muted | `#6B6560` | Meta, scores |
| Brand / Evidence | Teal `#0F766E` | Citations, primary actions, focus |
| Working | Soft amber `#A16207` on pale wash | Agent in progress |
| Cost signal | Burnt orange `#C2410C` on soft peach | CostEstimate only |
| Line | `#E5E2DC` | Hairlines |

---

## Typography

| Role | Direction |
| --- | --- |
| Display / empty / onboarding | Fraunces (sparingly) |
| UI / stream | DM Sans |
| IDs / traces / hashes | IBM Plex Mono |

Avoid Inter/Roboto as the designed stack.

---

## Layout Patterns (Knowledge Studio)

```
┌──────────┬─────────────────────────────────────────┐
│ AMKP     │  Thread title · Tenant chip · health    │
│          ├─────────────────────────────────────────┤
│ Threads  │                                         │
│ Docs     │     [ user turn + attachments ]         │
│ Eval…    │     [ working: hop 0 · hybrid… ]        │
│          │     [ Evidence artifact cards ]         │
│          │     [ cost pill · Open Trace ]          │
│          │                                         │
│          ├─────────────────────────────────────────┤
│          │  [+]  Ask the plane…        PreferCorrectness │
└──────────┴─────────────────────────────────────────┘
```

Optional right **Artifacts** drawer when Evidence selected (Claude artifacts feel).

---

## Motion

- Composer focus: subtle lift  
- Working steps: staggered appear (respect `prefers-reduced-motion`)  
- Evidence cards: soft fade-in, not bounce  

---

## Do / Don't

**Do:** Feel like Claude to use; prove like AMKP.  
**Don't:** Make the climax a free-form answer bubble without Evidence.  
**Don't:** Hide Active Tenant.  
**Don't:** Turn Admin into chat.
