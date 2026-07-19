---
story_key: "C-3.1-documents-list-upload"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-3.1 — Document list / upload

## Goal

Tenant Operator uploads documents and browses status for Active Tenant (CAP-3).

## Acceptance criteria

1. Operator lists documents via `AmkpClient.listDocuments`. ✅
2. Multipart upload via `ingestUpload`. ✅
3. Admin sees guidance to use Operator key (no tenant client with admin token). ✅
4. Lives under `features/documents/` atomic layout. ✅

## Files

- `apps/console/src/features/documents/pages/DocumentsPage.tsx`
