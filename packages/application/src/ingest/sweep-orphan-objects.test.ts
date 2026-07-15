import { describe, expect, it } from "vitest";
import type { ObjectStoragePort } from "./object-storage";
import { SweepOrphanObjectsUseCase } from "./sweep-orphan-objects";

describe("SweepOrphanObjectsUseCase", () => {
  it("reports orphans in dry-run and deletes when dryRun=false", async () => {
    const keys = new Set([
      "tenants/ten_a/documents/doc_live",
      "tenants/ten_a/documents/doc_orphan",
    ]);
    const storage: ObjectStoragePort = {
      async put() {},
      async get() {
        return null;
      },
      async delete(key: string) {
        keys.delete(key);
      },
      async listKeys() {
        return [...keys].sort();
      },
    };
    const docs = {
      async listStorageKeys() {
        return ["tenants/ten_a/documents/doc_live"];
      },
    };
    const uc = new SweepOrphanObjectsUseCase(storage, docs);

    const dry = await uc.execute({ dryRun: true });
    expect(dry.orphaned).toEqual(["tenants/ten_a/documents/doc_orphan"]);
    expect(dry.deleted).toEqual([]);
    expect(keys.size).toBe(2);

    const live = await uc.execute({ dryRun: false });
    expect(live.deleted).toEqual(["tenants/ten_a/documents/doc_orphan"]);
    expect(keys.has("tenants/ten_a/documents/doc_orphan")).toBe(false);
    expect(keys.has("tenants/ten_a/documents/doc_live")).toBe(true);
  });
});
