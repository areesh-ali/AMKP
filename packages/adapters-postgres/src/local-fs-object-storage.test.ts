import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFsObjectStorage } from "./local-fs-object-storage";

describe("LocalFsObjectStorage", () => {
  let root: string;
  let store: LocalFsObjectStorage;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "amkp-obj-"));
    store = new LocalFsObjectStorage(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("puts and gets tenant-scoped keys", async () => {
    const key = "tenants/ten_a/documents/doc_1";
    await store.put({
      key,
      bytes: Buffer.from("hello pdf"),
      contentType: "application/pdf",
    });
    const got = await store.get(key);
    expect(got?.toString()).toBe("hello pdf");
  });

  it("rejects path traversal", async () => {
    await expect(
      store.put({
        key: "../escape.bin",
        bytes: Buffer.from("x"),
        contentType: "application/octet-stream",
      }),
    ).rejects.toThrow(/escapes storage root/);
  });

  it("returns null for missing keys", async () => {
    expect(await store.get("tenants/x/documents/missing")).toBeNull();
  });

  it("lists keys under prefix", async () => {
    await store.put({
      key: "tenants/ten_a/documents/doc_1",
      bytes: Buffer.from("a"),
      contentType: "text/plain",
    });
    await store.put({
      key: "tenants/ten_b/documents/doc_2",
      bytes: Buffer.from("b"),
      contentType: "text/plain",
    });
    const all = await store.listKeys("tenants/");
    expect(all).toEqual([
      "tenants/ten_a/documents/doc_1",
      "tenants/ten_b/documents/doc_2",
    ]);
    const onlyA = await store.listKeys("tenants/ten_a");
    expect(onlyA).toEqual(["tenants/ten_a/documents/doc_1"]);
  });
});
