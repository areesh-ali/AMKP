import { describe, expect, it } from "vitest";
import { OpenAiEmbeddingProvider } from "./openai-embedding-provider";

describe("OpenAiEmbeddingProvider", () => {
  it("pads/truncates vectors to configured dimensions", async () => {
    const provider = new OpenAiEmbeddingProvider({
      apiKey: "test",
      dimensions: 4,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          data: [{ index: 0, embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
        }),
        { status: 200 },
      )) as typeof fetch;
    try {
      const [vec] = await provider.embed(["hello"]);
      expect(vec).toEqual([0.1, 0.2, 0.3, 0.4]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
