import { describe, expect, it, vi } from "vitest";
import {
  HttpDocumentStatusNotifier,
  createDocumentStatusNotifierFromEnv,
} from "./http-document-webhook";

describe("HttpDocumentStatusNotifier", () => {
  it("posts event JSON", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 204 }));
    const notifier = new HttpDocumentStatusNotifier(
      "https://hooks.example/amkp",
      fetchFn as unknown as typeof fetch,
    );
    await notifier.notify({
      tenantId: "ten_a",
      documentId: "doc_1",
      status: "parsed",
      chunkCount: 3,
    });
    expect(fetchFn).toHaveBeenCalledOnce();
    const init = fetchFn.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.documentId).toBe("doc_1");
    expect(body.status).toBe("parsed");
  });

  it("swallows network errors", async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error("boom");
    });
    const notifier = new HttpDocumentStatusNotifier(
      "https://hooks.example/amkp",
      fetchFn as unknown as typeof fetch,
    );
    await expect(
      notifier.notify({
        tenantId: "ten_a",
        documentId: "doc_1",
        status: "parsed",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("createDocumentStatusNotifierFromEnv", () => {
  it("returns undefined when unset", () => {
    const prev = process.env.AMKP_DOCUMENT_WEBHOOK_URL;
    delete process.env.AMKP_DOCUMENT_WEBHOOK_URL;
    expect(createDocumentStatusNotifierFromEnv()).toBeUndefined();
    if (prev !== undefined) process.env.AMKP_DOCUMENT_WEBHOOK_URL = prev;
  });
});
