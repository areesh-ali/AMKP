---
story_key: "C-1.2-session-vault"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-1.2 — Session / credential vault

## Goal

Authorized users establish a Console session (Platform Admin vs Tenant Operator) with credentials stored only in a tab session vault (CAP-1).

## Acceptance criteria

1. Unauthenticated users hitting protected routes redirect to `/sign-in`. ✅
2. Sign-in requires non-empty credential; stores role + credential in `sessionStorage`. ✅
3. Sign-out clears vault and returns to sign-in. ✅
4. Plane clients created only via `@amkp/sdk-js` (`createPlaneClient`). ✅

## Architecture (Winston)

- v1 vault = `sessionStorage` key `amkp.console.session.v1` (OIDC later, no rename)
- No DB/Redis from Console process

## Files

- `apps/console/src/session/vault.ts`
- `apps/console/src/session/SessionContext.tsx`
- `apps/console/src/session/RequireAuth.tsx`
- `apps/console/src/api/client.ts`
- `apps/console/src/session/vault.test.ts`
