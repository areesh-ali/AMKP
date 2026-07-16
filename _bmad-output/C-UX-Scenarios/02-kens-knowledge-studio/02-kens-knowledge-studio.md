# 02: Ken's Knowledge Studio

**Project:** AMKP  
**Created:** 2026-07-16  
**Method:** Whiteport Design Studio (WDS) · Suggest mode (loop-approved)

---

## Transaction (Q1)

**What this scenario covers:**  
Upload a multimodal document into the Active Tenant, ask the plane a question in a Claude-like studio, and receive Evidence with citations and cost — then inspect how the agent worked.

---

## Business Goal (Q2)

**Goal:** Time-to-proof (&lt;60m to Evidence) + agentic clarity  
**Objective:** Objectives 1 and 4 — Evidence climax; hops inspectable

---

## User & Situation (Q3)

**Persona:** Ken (Secondary · primary UX design target)  
**Situation:** Staff engineer / Operator; Tenant `support` already provisioned by Maya; afternoon desk session proving multimodal retrieve before a security review.

---

## Driving Forces (Q4)

**Hope:** Claude-clear upload → working → Evidence with citations and cost.  

**Worry:** Pretty chat that invents answers, or a blind spinner with the wrong Tenant.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Desktop  
**Entry:** Already signed in as Tenant Operator; Active Tenant chip shows `support`; opens Documents from the left rail.

---

## Best Outcome (Q7)

**User Success:**  
Parsed multimodal doc; Evidence cards with table/page citation; cost pill visible; Trace shows router + hops as tool steps.

**Business Success:**  
CAP-3/4/5 proven in Claude grammar; PreferCorrectness outcome first-class; zero Tenant confusion.

---

## Shortest Path (Q8)

1. **Documents** — Uploads fixture; watches status → parsed  
2. **Document detail** — Confirms version/chunks ready for retrieve  
3. **Knowledge Studio** — Composes query, PreferCorrectness on, runs; watches agent working steps  
4. **Thread / Retrieve detail** — Reviews Evidence artifacts + cost pill  
5. **Trace inspector** — Opens Trace from requestId; reads hop timeline ✓  

---

## Trigger Map Connections

**Persona:** Ken (Secondary)

**Driving Forces Addressed:**
- ✅ **Want:** Upload + working UI; Evidence + cost; readable hops  
- ❌ **Fear:** Ungrounded chat; blind spinner; wrong Tenant  

**Business Goal:** Time-to-proof + agentic transparency

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 2.1 | `2.1-documents` | Ingest fixture into Active Tenant | Opens document detail |
| 2.2 | `2.2-document-detail` | Confirm parse/chunks | Goes to Knowledge Studio |
| 2.3 | `2.3-knowledge-studio` | Ask plane; watch working | Opens thread result |
| 2.4 | `2.4-thread-retrieve-detail` | Evidence + cost climax | Opens Trace |
| 2.5 | `2.5-trace-inspector` | Inspect hops | Scenario success ✓ |
