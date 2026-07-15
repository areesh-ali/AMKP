import { describe, expect, it } from "vitest";
import { documentObjectKey } from "./object-storage";

describe("documentObjectKey", () => {
  it("scopes keys under tenant prefix", () => {
    expect(documentObjectKey("ten_a", "doc_1")).toBe(
      "tenants/ten_a/documents/doc_1",
    );
  });
});
