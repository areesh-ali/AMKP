# Project Brief: AMKP Console

> Complete Strategic Foundation (WDS fast-path from SPEC-amkp-console + plane brief)

**Created:** 2026-07-16  
**Author:** areesh  
**Brief Type:** Complete (seeded)  
**Product:** AMKP Console — human product layer on the AMKP plane  
**Sources:** `specs/spec-amkp-console/SPEC.md`, plane brief `briefs/brief-RAG-Sol-2026-07-14/brief.md`

---

## Vision

AMKP Console is the calm, Claude-like home where humans operate an enterprise knowledge plane: upload documents into a Tenant, watch the agent work, and get **Evidence with citations and cost** — not a chatty ungrounded answer as the product promise.

It feels like Claude.ai in shell and motion (threads, composer, uploads, “working…” tool steps, artifacts). It remains **AMKP**: hard tenancy, multimodal fidelity, guarded agentic, SDK/MCP still first-class.

---

## Positioning Statement

For platform and product engineers who need to prove and operate multi-tenant RAG under real products, AMKP Console is the Claude-feel ops studio for the AMKP knowledge plane that makes ingest → retrieve → trace feel interactive and trustworthy — unlike workforce search UIs or DIY LangChain dashboards — because Evidence, Tenant isolation, and cost are always visible while the agent works.

**Breakdown:**

- **Target Customer:** Multi-product SaaS / ISV platform teams (and their Tenant Operators)
- **Need/Opportunity:** Plane APIs exist; humans still need a first-party product to stand up Tenants, upload, retrieve, and debug — without replacing SDK/MCP
- **Category:** Enterprise knowledge-plane console (ops + Evidence studio)
- **Key Benefit:** Claude-like interaction clarity + Evidence-first grounding contract
- **Differentiator:** Hard tenancy chrome always on; agent hops as visible tool work; citations + CostEstimate as the climax — not a free-form final answer

---

## Business Model

**Type:** B2B — Console ships with the AMKP plane (usage/tenancy SKUs). Console is the human surface; API/SDK/MCP remain the integration surface.

### Business Customer Profile (B2B)

Mid-market SaaS with 2+ AI-facing products sharing one knowledge plane.

| Role | Description |
| --- | --- |
| **Buyer** | Platform / Eng leadership funding the plane |
| **Champion** | Platform engineer (Maya) proving two Tenants in a day |
| **User** | Tenant Operator (Ken) running ingest/retrieve/eval; new developer (Priya) onboarding |

---

## Ideal Customer Profile (ICP)

Platform engineer who must ship grounded AI across products without a three-person ML platform team. Success = two Tenants live, zero cross-Tenant leaks, Evidence they can show security.

### Secondary Users

- Tenant Operators proving multimodal retrieve and evals  
- Security / AI CoE reviewers inspecting Traces and isolation  
- New developers completing guided onboarding &lt;60 minutes  

---

## Success Criteria

- Admin stands up Account → two Tenants → API keys in Console  
- Operator uploads docs in-thread, sees parse/agent working states, retrieves Evidence + cost  
- Trace hops readable as discrete “tool” steps (Claude-like)  
- Guided path Account→key→ingest→retrieve &lt; 60 minutes  
- Zero cross-Tenant disclosure in UI + plane checks  
- SDK/MCP paths unchanged  

---

## Competitive Landscape

| Alternative | Gap |
| --- | --- |
| Claude.ai / ChatGPT home | General chat; not hard multi-tenant knowledge plane ops |
| Glean-class workforce search | Wrong surface for product backends |
| DIY admin on LangChain | No packaged Evidence/cost/tenancy contract |
| Commodity RaaS consoles | Weak multimodal + isolation theater |

### Our Unfair Advantage

Plane already guarantees Evidence, tenancy, traces, eval; Console makes that **feel** as clear as Claude’s agent UI.

---

## Constraints

- Talk to plane **only** via HTTP/`@amkp/sdk-js`  
- Active Tenant always explicit; fail closed  
- **Primary Retrieve contract = Evidence + citations + cost** (optional short grounded gloss secondary)  
- Not Glean workforce search; not replacing SDK/MCP  
- English-first; `apps/console`  

---

## Platform & Device Strategy

**Primary Platform:** Web SPA (`apps/console`, Vite + React)  
**Supported Devices:** Desktop-first; tablet usable  
**Device Priority:** Desktop ops → tablet → mobile read-light  

**Interaction Models:**

1. **Knowledge Studio (primary Operator home)** — Claude-like: thread list + composer + streaming agent work + upload + Evidence artifacts  
2. **Admin / Ops** — quieter settings density for Accounts, Tenants, keys, health, policy, eval reports  
3. **Onboarding runway** — checklist that climaxes on first Evidence in-studio  

**Technical Requirements:**

- Offline: not required  
- Native features: file upload / drag-drop; clipboard for API keys  

---

## Product Concept (interaction principle — locked for design)

### Claude-like shell

- Soft, spacious canvas; minimal chrome; generous composer  
- Left: threads / recent Retrieves / Documents context  
- Center: conversation stream  
- Upload docs from composer (and Documents surface)  
- Agent “working” with expandable steps (router, search hop, rerank, agentic hop)  
- Artifacts panel / cards for Evidence, CostEstimate, Trace  

### AMKP contract inside that shell

| Turn type | What the user sees |
| --- | --- |
| User | Query + optional PreferCorrectness / mode + attached docs |
| Agent working | Live steps (like Claude tool use) — not a spinner void |
| Climax | Ranked **Evidence** cards + citations + **cost pill**; `insufficient_evidence` first-class |
| Optional | Short grounded gloss *secondary* to Evidence — never the only contract |

**Non-goal preserved:** free-form ungrounded chat as the product promise.

---

## Tone of Voice

Calm, precise, evidence-forward. “Evidence returned — 4 items, $0.002 est.” Not “Here’s your answer! ✨”

---

## Visual Direction (summary)

See `visual-direction.md`. Inspiration: **Claude.ai interaction grammar** (composer, threads, working states, artifacts). Brand: **AMKP**. Palette: warm-calm stone paper + soft ink + teal Evidence accent (AMKP) + subtle signal for cost — Claude *feel*, AMKP identity.

---

## Related Artifacts

- SPEC: `_bmad-output/specs/spec-amkp-console/SPEC.md`  
- Plane brief: `_bmad-output/planning-artifacts/briefs/brief-RAG-Sol-2026-07-14/brief.md`  
- Trigger Map: `_bmad-output/B-Trigger-Map/trigger-map.md`  
