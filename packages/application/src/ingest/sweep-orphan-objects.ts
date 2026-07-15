import type { ObjectStoragePort } from "./object-storage";

export interface ListedStorageKeyRepository {
  /** All non-null storage_key values currently referenced by Documents. */
  listStorageKeys(): Promise<string[]>;
}

export interface SweepOrphanObjectsResult {
  scanned: number;
  orphaned: string[];
  deleted: string[];
  dryRun: boolean;
}

/**
 * Delete object-storage keys under `tenants/` that are not referenced by any
 * Document.storage_key. Requires storage.listKeys.
 */
export class SweepOrphanObjectsUseCase {
  constructor(
    private readonly storage: ObjectStoragePort,
    private readonly documents: ListedStorageKeyRepository,
  ) {}

  async execute(opts?: {
    dryRun?: boolean;
    prefix?: string;
  }): Promise<SweepOrphanObjectsResult> {
    if (!this.storage.listKeys) {
      throw new Error("Object storage does not support listKeys");
    }
    const prefix = opts?.prefix ?? "tenants/";
    const dryRun = opts?.dryRun !== false;
    const keys = await this.storage.listKeys(prefix);
    const referenced = new Set(await this.documents.listStorageKeys());
    const orphaned = keys.filter((k) => !referenced.has(k));
    const deleted: string[] = [];
    if (!dryRun) {
      for (const key of orphaned) {
        await this.storage.delete(key);
        deleted.push(key);
      }
    }
    return {
      scanned: keys.length,
      orphaned,
      deleted,
      dryRun,
    };
  }
}
