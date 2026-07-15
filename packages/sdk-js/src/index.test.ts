import { describe, expect, it, vi } from "vitest";
import { AmkpApiError, AmkpAdminClient, AmkpClient } from "./index";

describe("AmkpClient (T-8.2)", () => {
  it("retrieve and getTrace call expected paths with Bearer auth", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/v1/retrieve")) {
        expect(init?.headers).toMatchObject({
          Authorization: "Bearer amkp_test",
        });
        return new Response(
          JSON.stringify({
            schemaVersion: "1",
            requestId: "req_1",
            tenantId: "ten_1",
            outcome: { kind: "evidence", items: [] },
            costEstimate: { currency: "USD", estimatedUsd: 0 },
          }),
          { status: 200 },
        );
      }
      if (String(url).includes("/v1/traces/req_1")) {
        return new Response(
          JSON.stringify({
            requestId: "req_1",
            tenantId: "ten_1",
            createdAt: new Date().toISOString(),
            routerDecision: { mode: "single_pass", reasonCode: "default" },
            evidenceIds: [],
            outcomeKind: "evidence",
            costEstimate: { currency: "USD", estimatedUsd: 0 },
            steps: [],
          }),
          { status: 200 },
        );
      }
      return new Response("nope", { status: 404 });
    });

    const client = new AmkpClient({
      baseUrl: "http://localhost:3000",
      apiKey: "amkp_test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const env = await client.retrieve({ query: "hello" });
    expect(env.requestId).toBe("req_1");
    const trace = await client.getTrace("req_1");
    expect(trace.requestId).toBe("req_1");
  });

  it("throws AmkpApiError with requestId from body", async () => {
    const client = new AmkpClient({
      baseUrl: "http://x",
      apiKey: "k",
      fetch: (async () =>
        new Response(
          JSON.stringify({
            error: { code: "X", message: "nope", request_id: "req_err" },
          }),
          { status: 401 },
        )) as unknown as typeof fetch,
    });
    await expect(client.me()).rejects.toMatchObject({
      name: "AmkpApiError",
      status: 401,
      requestId: "req_err",
    });
  });

  it("listDocumentChunks hits chunks path", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(String(url)).toContain("/v1/documents/doc_1/chunks");
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    const client = new AmkpClient({
      baseUrl: "http://localhost:3000",
      apiKey: "k",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const res = await client.listDocumentChunks("doc_1");
    expect(res.items).toEqual([]);
  });

  it("forwards x-request-id when configured", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        "x-request-id": "client_req",
      });
      return new Response(JSON.stringify({ tenantId: "t", accountId: "a" }), {
        status: 200,
      });
    });
    const client = new AmkpClient({
      baseUrl: "http://x",
      apiKey: "k",
      requestId: "client_req",
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.me();
  });
});

describe("AmkpAdminClient", () => {
  it("createApiKey posts to tenant api-keys", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toContain("/v1/tenants/ten_1/api-keys");
      expect(init?.method).toBe("POST");
      return new Response(
        JSON.stringify({
          apiKeyId: "key_1",
          tenantId: "ten_1",
          apiKey: "amkp_plain",
          createdAt: "2026-01-01T00:00:00.000Z",
        }),
        { status: 201 },
      );
    });
    const admin = new AmkpAdminClient({
      baseUrl: "http://x",
      adminToken: "admin",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const issued = await admin.createApiKey("ten_1");
    expect(issued.apiKey).toBe("amkp_plain");
  });
});

describe("AmkpApiError", () => {
  it("is instanceof Error", () => {
    expect(new AmkpApiError(500, null)).toBeInstanceOf(Error);
  });
});
