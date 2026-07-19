---
story_key: "C-3.2-document-detail-versions-chunks"
status: done
spec: "_bmad-output/specs/spec-amkp-console/SPEC.md"
---

# C-3.2 — Document detail / versions / chunks

## Goal

Operator opens a document from the list, sees metadata, version history for `sourceKey`, and chunk previews before Retrieve (CAP-3).

## Acceptance criteria

1. Route `documents/:documentId` loads via `AmkpClient.getDocument`. ✅
2. Versions from `listDocumentVersions(sourceKey)` with links between versions. ✅
3. Chunks from `listDocumentChunks` with ordinal/preview. ✅
4. List rows link into detail; Studio CTA exits to Ask. ✅
5. Atomic layout under `features/documents/{pages,components,lib}`. ✅

## Files

- `apps/console/src/features/documents/pages/DocumentDetailPage.tsx`
- `apps/console/src/features/documents/components/VersionsList.tsx`
- `apps/console/src/features/documents/components/ChunksPreview.tsx`
- `apps/console/src/features/documents/lib/types.ts`
- `apps/console/src/features/documents/pages/DocumentsPage.tsx` (row links)
- `apps/console/src/app/App.tsx` (route)
