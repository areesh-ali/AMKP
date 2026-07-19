---
story_key: "C-4.1-retrieve-studio"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-4.1 — Retrieve studio

## Goal

Operator runs Retrieve from Knowledge Studio composer via `@amkp/sdk-js` (CAP-4).

## Acceptance criteria

1. Composer submits `AmkpClient.retrieve({ query, preferCorrectness, mode })`. ✅
2. Mode toggle: `single_pass` | `agentic`. ✅
3. PreferCorrectness checkbox. ✅
4. Admin/non-operator cannot fire Retrieve. ✅
5. Atomic `features/studio/{pages,components}`. ✅

## Files

- `apps/console/src/features/studio/pages/StudioPage.tsx`
- `apps/console/src/features/studio/components/Composer.tsx`
