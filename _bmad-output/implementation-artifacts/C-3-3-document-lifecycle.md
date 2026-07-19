---
story_key: "C-3.3-document-lifecycle"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-3.3 — Document lifecycle

## Goal

Operator can reparse, download, delete, and prune document versions from detail (CAP-3).

## Acceptance criteria

1. Reparse via `AmkpClient.reparseDocument`. ✅
2. Download via `getDocumentContent` (browser blob). ✅
3. Delete via `deleteDocument` → return to list. ✅
4. Prune via `pruneDocumentVersions({ sourceKey, keep })`. ✅
5. Lives in `features/documents/components/LifecycleActions.tsx`. ✅

## Files

- `apps/console/src/features/documents/components/LifecycleActions.tsx`
- `apps/console/src/features/documents/pages/DocumentDetailPage.tsx`
