import type { DocumentId, TenantId } from "@amkp/domain";

/**
 * Blob store for Document bytes (deferred S3 path).
 * Keys must be Tenant-scoped — never share prefixes across Tenants.
 */
export interface ObjectStoragePort {
  put(input: {
    key: string;
    bytes: Buffer;
    contentType: string;
  }): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");

/** Fail-closed key builder — Tenant always owns the prefix. */
export function documentObjectKey(
  tenantId: TenantId,
  documentId: DocumentId,
): string {
  return `tenants/${tenantId}/documents/${documentId}`;
}
