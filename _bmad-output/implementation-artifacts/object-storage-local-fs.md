---
story_key: "object-storage-local-fs"
status: done
created: 2026-07-15
---

# Object storage for Document bytes (local FS)

## Acceptance

1. `ObjectStoragePort` + Tenant-scoped keys — PASS
2. `LocalFsObjectStorage` with path-traversal rejection — PASS
3. `PrismaDocumentRepository` optional storage; `AMKP_OBJECT_STORAGE_DIR` wires API/worker — PASS
4. Default remains BYTEA when env unset — PASS
