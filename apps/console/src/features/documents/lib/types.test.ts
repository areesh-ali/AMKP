import { describe, expect, it } from "vitest";
import {
  asChunks,
  asDocs,
  asVersions,
  docId,
  statusTone,
} from "./types";

describe("documents/lib/types", () => {
  it("asDocs keeps objects only", () => {
    expect(asDocs([{ id: "1" }, null, "x"] as unknown[])).toEqual([
      { id: "1" },
    ]);
  });

  it("asVersions requires documentId string", () => {
    expect(
      asVersions([
        { documentId: "d1", version: 2 },
        { version: 1 },
        null,
      ] as unknown[]),
    ).toEqual([{ documentId: "d1", version: 2 }]);
  });

  it("asChunks requires chunkId string", () => {
    expect(
      asChunks([
        { chunkId: "c1", ordinal: 0 },
        { ordinal: 1 },
      ] as unknown[]),
    ).toEqual([{ chunkId: "c1", ordinal: 0 }]);
  });

  it("docId prefers documentId then id", () => {
    expect(docId({ documentId: "a", id: "b" })).toBe("a");
    expect(docId({ id: "b" })).toBe("b");
    expect(docId({})).toBe("");
  });

  it("statusTone maps parse lifecycle", () => {
    expect(statusTone("parsed")).toBe("ok");
    expect(statusTone("processing")).toBe("warn");
    expect(statusTone("failed")).toBe("danger");
    expect(statusTone("weird")).toBe("muted");
  });
});
