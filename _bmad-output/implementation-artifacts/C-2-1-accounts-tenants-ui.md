---
story_key: "C-2.1-accounts-tenants-ui"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-2.1 — Accounts / Tenants UI

## Goal

Platform Admin creates and lists Accounts and Tenants in Console (CAP-2).

## Acceptance criteria

1. Admin can list accounts and tenants via `AmkpAdminClient`. ✅
2. Admin can create Account and Tenant; create Tenant shows one-time API key. ✅
3. Set Active Tenant from tenant row updates chrome chip. ✅
4. Errors surface with requestId when `AmkpApiError`. ✅

## Files

- `apps/console/src/pages/AdminTenantsPage.tsx`
