import { createHmac, timingSafeEqual } from "node:crypto";
import type { DocumentStatusNotifier } from "@amkp/application";

/**
 * POST JSON document lifecycle events to AMKP_DOCUMENT_WEBHOOK_URL.
 * Failures are logged and swallowed so parse jobs are not blocked.
 * When AMKP_DOCUMENT_WEBHOOK_SECRET is set, sends
 * `X-AMKP-Signature: sha256=<hmac_hex>` over the raw body.
 */
export class HttpDocumentStatusNotifier implements DocumentStatusNotifier {
  constructor(
    private readonly endpoint: string,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly secret?: string,
  ) {}

  async notify(event: {
    tenantId: string;
    documentId: string;
    status: string;
    parseTier?: string;
    chunkCount?: number;
    usedVlm?: boolean;
  }): Promise<void> {
    try {
      const body = JSON.stringify({
        ...event,
        at: new Date().toISOString(),
      });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "amkp-document-webhook/1",
      };
      if (this.secret) {
        const sig = createHmac("sha256", this.secret)
          .update(body, "utf8")
          .digest("hex");
        headers["X-AMKP-Signature"] = `sha256=${sig}`;
      }
      const res = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn(
          `[webhook] document status ${res.status} for ${event.documentId}`,
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[webhook] document status failed for ${event.documentId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

export function createDocumentStatusNotifierFromEnv(
  fetchFn: typeof fetch = fetch,
): DocumentStatusNotifier | undefined {
  const url = process.env.AMKP_DOCUMENT_WEBHOOK_URL?.trim();
  if (!url) return undefined;
  const secret = process.env.AMKP_DOCUMENT_WEBHOOK_SECRET?.trim() || undefined;
  return new HttpDocumentStatusNotifier(url, fetchFn, secret);
}

/** Verify `X-AMKP-Signature` for receivers (exported for tests / SDKs). */
export function verifyAmkpWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
