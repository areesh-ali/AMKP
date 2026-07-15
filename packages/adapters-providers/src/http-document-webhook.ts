import type { DocumentStatusNotifier } from "@amkp/application";

/**
 * POST JSON document lifecycle events to AMKP_DOCUMENT_WEBHOOK_URL.
 * Failures are logged and swallowed so parse jobs are not blocked.
 */
export class HttpDocumentStatusNotifier implements DocumentStatusNotifier {
  constructor(
    private readonly endpoint: string,
    private readonly fetchFn: typeof fetch = fetch,
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
      const res = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "amkp-document-webhook/1",
        },
        body: JSON.stringify({
          ...event,
          at: new Date().toISOString(),
        }),
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
  return new HttpDocumentStatusNotifier(url, fetchFn);
}
