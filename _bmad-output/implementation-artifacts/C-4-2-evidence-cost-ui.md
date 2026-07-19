---
story_key: "C-4.2-evidence-cost-prefer-correctness-ui"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-4.2 — Evidence + cost + PreferCorrectness UI

## Goal

Surface EvidenceEnvelope climax: citations, insufficient_evidence, CostEstimate (CAP-4).

## Acceptance criteria

1. Evidence items with score, content preview, document citation link. ✅
2. `insufficient_evidence` state shows reason + threshold. ✅
3. CostChip for estimated/actual USD. ✅
4. Link toward Trace inspector via requestId. ✅

## Files

- `apps/console/src/features/studio/components/EvidencePanel.tsx`
- `apps/console/src/shared/ui/molecules/CostChip.tsx`
