# 01: Maya's Tenant Standup

**Project:** AMKP  
**Created:** 2026-07-16  
**Method:** Whiteport Design Studio (WDS) · Suggest mode (loop-approved)

---

## Transaction (Q1)

**What this scenario covers:**  
Stand up an Account with two Product Tenants and issue API keys she can trust and audit.

---

## Business Goal (Q2)

**Goal:** Isolation confidence (zero cross-Tenant leaks)  
**Objective:** Objective 2 — demonstrable hard tenancy + Admin path without CLI archaeology

---

## User & Situation (Q3)

**Persona:** Maya (Primary)  
**Situation:** Platform engineer at mid-market SaaS; Support and Docs bots were forking RAG; Monday morning at her desk, leadership asked for one shared plane with proof of isolation.

---

## Driving Forces (Q4)

**Hope:** Two Tenants live today with keys and an audit trail she can show.  

**Worry:** Soft-tenancy embarrassment in the next security bake-off.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Desktop  
**Entry:** Opens Console URL from internal wiki bookmark; signs in as Platform Admin with vault credential.

---

## Best Outcome (Q7)

**User Success:**  
Tenants `support` and `billing` exist; API key for `support` copied once; Audit shows create/issue; Health green.

**Business Success:**  
Account multi-tenant ready; CAP-2/8 path proven; plane adoption unblocked for Operators.

---

## Shortest Path (Q8)

1. **Sign-in** — Chooses Platform Admin, enters credential, lands in Admin shell with AMKP wordmark  
2. **Admin · Accounts & Tenants** — Creates Account “Acme”, Tenants `support` and `billing`  
3. **Admin · API keys** — Issues key for `support`; one-time reveal + copy  
4. **Admin · Audit** — Confirms create/issue events with actor/time  
5. **Admin · Health & ops** — Sees ready/adapters; optional dry-run sweep counts ✓  

---

## Trigger Map Connections

**Persona:** Maya (Primary)

**Driving Forces Addressed:**
- ✅ **Want:** Two products on one plane fast; keys + audit  
- ❌ **Fear:** Soft tenancy; opaque ops  

**Business Goal:** Isolation confidence + DX-intact Admin surface

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 1.1 | `1.1-sign-in` | Establish Admin session | Continues to Accounts & Tenants |
| 1.2 | `1.2-admin-accounts-tenants` | Create Account + two Tenants | Opens API keys for `support` |
| 1.3 | `1.3-admin-api-keys` | Issue + one-time reveal key | Opens Audit |
| 1.4 | `1.4-admin-audit` | Verify mutations | Opens Health & ops |
| 1.5 | `1.5-admin-health-ops` | Confirm plane ready | Scenario success ✓ |
