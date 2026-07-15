import { describe, expect, it } from "vitest";
import { StubEmbeddingProvider } from "./stub-embedding-provider";
import { STUB_EMBEDDING_DIMS } from "@amkp/application";

describe("StubEmbeddingProvider", () => {
  it("embeds batches at fixed dimensions", async () => {
    const p = new StubEmbeddingProvider();
    const [a, b] = await p.embed(["hello world", "hello world"]);
    expect(a).toEqual(b);
    expect(a).toHaveLength(STUB_EMBEDDING_DIMS);
  });
});
