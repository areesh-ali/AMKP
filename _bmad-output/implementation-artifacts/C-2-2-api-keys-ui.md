---
story_key: "C-2.2-api-keys-ui"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-2.2 — API keys UI

## Goal

Platform Admin issues, lists, revokes, and rotates Tenant API keys with one-time plaintext reveal (CAP-2).

## Acceptance criteria

1. List keys for a Tenant via `AmkpAdminClient.listApiKeys`. ✅
2. Issue key shows one-time plaintext + copy. ✅
3. Revoke requires confirm; rotate shows new plaintext once. ✅
4. Admin-only route. ✅

## Files

- `apps/console/src/pages/AdminApiKeysPage.tsx`
