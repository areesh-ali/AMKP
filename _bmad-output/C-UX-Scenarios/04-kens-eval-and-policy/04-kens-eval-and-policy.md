# 04: Ken's Eval and Policy

**Project:** AMKP  
**Created:** 2026-07-16  
**Method:** Whiteport Design Studio (WDS) · Suggest mode (loop-approved)

---

## Transaction (Q1)

**What this scenario covers:**  
Run a golden-set / TableRank eval and tune Tenant policy so PreferCorrectness and agentic flags match the bake-off bar.

---

## Business Goal (Q2)

**Goal:** Agentic / governance clarity  
**Objective:** Objective 4 + CAP-6/7 — inspectable quality and policy with audit

---

## User & Situation (Q3)

**Persona:** Ken (Secondary · security liaison hat)  
**Situation:** After Knowledge Studio proof; preparing CoE bake-off the next morning at his desk.

---

## Driving Forces (Q4)

**Hope:** Pass/fail eval report and policy settings he can defend.  

**Worry:** Opaque PreferCorrectness threshold or unbounded agentic spend.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Desktop  
**Entry:** From Console left rail after Studio session; Active Tenant still `support`.

---

## Best Outcome (Q7)

**User Success:**  
Eval report with pass/fail (TableRank contrast visible); policy toggles saved; change reflected after refresh.

**Business Success:**  
CAP-6/7 met; POC Pack entry reachable; governance story intact.

---

## Shortest Path (Q8)

1. **Eval console** — Runs golden-set; reviews machine-readable report  
2. **Tenant policy** — Adjusts PreferCorrectness / agentic / page-vision; confirms persisted ✓  

---

## Trigger Map Connections

**Persona:** Ken (Secondary)

**Driving Forces Addressed:**
- ✅ **Want:** Eval proof; controllable policy  
- ❌ **Fear:** Opaque agentic spend / weak PreferCorrectness  

**Business Goal:** Agentic transparency + production governance

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 4.1 | `4.1-eval-console` | Produce eval report | Opens Tenant policy |
| 4.2 | `4.2-tenant-policy` | Tune and persist flags | Scenario success ✓ |
