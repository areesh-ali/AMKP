---
story_key: "C-1.3-role-tenant-chrome"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-1.3 — Role-gated layout + Active Tenant chrome

## Goal

Shell reflects role; Active Tenant chip always visible for Operator APIs; Admin routes hidden/denied for Operators (CAP-1).

## Acceptance criteria

1. Admin nav (Tenants/Keys/Audit/Health) only for Platform Admin. ✅
2. Operator hitting `/admin/*` redirects to Studio. ✅
3. Active Tenant chip shows current tenant; click opens switcher to set tenant id. ✅
4. Studio empty state is Claude-like (centered ask + bottom composer). ✅

## UX (Sally)

Claude grammar: warm stone, soft composer card, AMKP wordmark, Tenant chip ink.

## Files

- `apps/console/src/components/Shell.tsx`
- `apps/console/src/App.tsx` (`AdminOnly`)
- `apps/console/src/pages/StudioPage.tsx`
- `apps/console/src/pages/SignInPage.tsx`
