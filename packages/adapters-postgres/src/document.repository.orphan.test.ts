import { describe, expect, it, vi } from "vitest";
import type { ObjectStoragePort } from "@amkp/application";
import { PrismaDocumentRepository } from "./document.repository";

describe("PrismaDocumentRepository.create orphan compensation", () => {
  it("deletes put blob when DB insert fails", async () => {
    const deleted: string[] = [];
    const storage: ObjectStoragePort = {
      put: vi.fn(async () => undefined),
      get: vi.fn(async () => null),
      delete: vi.fn(async (key: string) => {
        deleted.push(key);
      }),
    };

    const prisma = {
      document: {
        create: vi.fn(async () => {
          throw new Error("unique_violation");
        }),
      },
    };

    const repo = new PrismaDocumentRepository(
      prisma as never,
      storage,
    );

    await expect(
      repo.create({
        tenantId: "ten_1",
        filename: "a.txt",
        contentType: "text/plain",
        content: Buffer.from("hello"),
        sourceKey: "a.txt",
        version: 1,
        contentHash: "hash",
      }),
    ).rejects.toThrow("unique_violation");

    expect(storage.put).toHaveBeenCalledOnce();
    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toMatch(/^tenants\/ten_1\/documents\/doc_/);
  });
});
