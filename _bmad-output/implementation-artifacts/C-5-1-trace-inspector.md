---
story_key: "C-5.1-trace-inspector"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-5.1 — Trace inspector

## Goal

Operator looks up a retrieve Trace by `requestId` and sees router decision + hops (CAP-5).

## Acceptance criteria

1. `AmkpClient.getTrace(requestId)`. ✅
2. URL `?requestId=` hydrate (from Evidence panel link). ✅
3. Shows outcome, cost, evidence IDs, hop steps. ✅
4. Atomic `features/traces/{pages,components}`. ✅
5. No cross-feature imports (CostChip in `shared/ui`). ✅

## Files

- `apps/console/src/features/traces/pages/TracesPage.tsx`
- `apps/console/src/features/traces/components/TraceDetail.tsx`
- `apps/console/src/features/traces/components/HopSteps.tsx`
