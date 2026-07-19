---
story_key: "C-2.3-audit-list"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-2.3 — Audit list

## Goal

Platform Admin reviews audit activity (actor/action/time) in Console (CAP-2).

## Acceptance criteria

1. Lists audit via `AmkpAdminClient.listAudit`. ✅
2. Optional Tenant filter. ✅
3. Admin-only; uses shared atomic UI. ✅

## Files

- `apps/console/src/features/admin/pages/AuditPage.tsx`
