import type { PageVisionProvider } from "@amkp/application";

/**
 * HTTP page-vision vendor adapter.
 * POSTs JSON `{ filename, contentType, contentBase64 }` to AMKP_PAGE_VISION_URL
 * and expects `{ text, confidence?, spendUsd? }`.
 */
export class HttpPageVisionProvider implements PageVisionProvider {
  constructor(
    private readonly endpoint: string,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly defaultSpendUsd = 0.02,
  ) {}

  async extract(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<{ text: string; confidence: number; spendUsd: number }> {
    const res = await this.fetchFn(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: input.filename,
        contentType: input.contentType,
        contentBase64: input.content.toString("base64"),
      }),
    });
    if (!res.ok) {
      throw new Error(
        `Page-vision vendor HTTP ${res.status}: ${await res.text().catch(() => "")}`,
      );
    }
    const body = (await res.json()) as {
      text?: string;
      confidence?: number;
      spendUsd?: number;
    };
    const text = typeof body.text === "string" ? body.text : "";
    if (!text.trim()) {
      throw new Error("Page-vision vendor returned empty text");
    }
    return {
      text,
      confidence:
        typeof body.confidence === "number" && !Number.isNaN(body.confidence)
          ? Math.min(1, Math.max(0, body.confidence))
          : 0.6,
      spendUsd:
        typeof body.spendUsd === "number" && body.spendUsd >= 0
          ? body.spendUsd
          : this.defaultSpendUsd,
    };
  }
}

export function createPageVisionProviderFromEnv(
  fetchFn: typeof fetch = fetch,
): PageVisionProvider | undefined {
  const url = process.env.AMKP_PAGE_VISION_URL?.trim();
  if (!url) return undefined;
  const spend = Number(process.env.AMKP_PAGE_VISION_SPEND_USD ?? "0.02");
  return new HttpPageVisionProvider(
    url,
    fetchFn,
    Number.isFinite(spend) && spend >= 0 ? spend : 0.02,
  );
}
