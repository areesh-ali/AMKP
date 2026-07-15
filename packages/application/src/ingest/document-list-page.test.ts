import { describe, expect, it } from "vitest";
import type { Document } from "@amkp/domain";
import {
  encodeDocumentCursor,
  paginateDocumentList,
} from "./document-list-page";

function doc(partial: Partial<Document> & { id: string; sourceKey: string }): Document {
  return {
    tenantId: "ten_a",
    filename: partial.sourceKey,
    contentType: "text/plain",
    byteSize: 1,
    status: "pending",
    version: partial.version ?? 1,
    contentHash: "h",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("paginateDocumentList", () => {
  const items = [
    doc({ id: "doc_a", sourceKey: "a.txt" }),
    doc({ id: "doc_b", sourceKey: "b.txt" }),
    doc({ id: "doc_c", sourceKey: "c.txt" }),
  ];

  it("returns nextCursor until exhausted", () => {
    const first = paginateDocumentList(items, { limit: 2 });
    expect(first.items.map((d) => d.id)).toEqual(["doc_a", "doc_b"]);
    expect(first.nextCursor).toBe(encodeDocumentCursor(items[1]!));

    const second = paginateDocumentList(items, {
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.items.map((d) => d.id)).toEqual(["doc_c"]);
    expect(second.nextCursor).toBeNull();
  });

  it("supports offset without cursor", () => {
    const page = paginateDocumentList(items, { limit: 1, offset: 1 });
    expect(page.items[0]?.id).toBe("doc_b");
    expect(page.offset).toBe(1);
  });
});
