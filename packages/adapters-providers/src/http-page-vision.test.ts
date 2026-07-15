import { describe, expect, it, vi } from "vitest";
import {
  HttpPageVisionProvider,
  createPageVisionProviderFromEnv,
} from "./http-page-vision";
import { LocalParseLadder } from "./local-parse-ladder";

describe("HttpPageVisionProvider", () => {
  it("posts document bytes and maps response", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(
        JSON.stringify({ text: "ocr hello", confidence: 0.8, spendUsd: 0.05 }),
        { status: 200 },
      ),
    );
    const provider = new HttpPageVisionProvider(
      "https://vlm.example/ocr",
      fetchFn as unknown as typeof fetch,
    );
    const out = await provider.extract({
      filename: "scan.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF"),
    });
    expect(out).toEqual({
      text: "ocr hello",
      confidence: 0.8,
      spendUsd: 0.05,
    });
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});

describe("createPageVisionProviderFromEnv", () => {
  it("returns undefined without URL", () => {
    const prev = process.env.AMKP_PAGE_VISION_URL;
    delete process.env.AMKP_PAGE_VISION_URL;
    expect(createPageVisionProviderFromEnv()).toBeUndefined();
    if (prev !== undefined) process.env.AMKP_PAGE_VISION_URL = prev;
  });
});

describe("LocalParseLadder with PageVisionProvider", () => {
  it("uses provider for tier3", async () => {
    const ladder = new LocalParseLadder(undefined, {
      async extract() {
        return { text: "vendor ocr", confidence: 0.9, spendUsd: 0.01 };
      },
    });
    const out = await ladder.extractTier3({
      filename: "x.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF"),
    });
    expect(out.text).toBe("vendor ocr");
    expect(out.usedVlm).toBe(true);
    expect(out.spendUsd).toBe(0.01);
  });
});
