import { describe, expect, it, vi } from "vitest";
import { AmkpApiError, AmkpClient } from "./index";

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

  it("throws AmkpApiError on non-2xx", async () => {
    const client = new AmkpClient({
      baseUrl: "http://x",
      apiKey: "k",
      fetch: (async () =>
        new Response(JSON.stringify({ error: { code: "X" } }), {
          status: 401,
        })) as unknown as typeof fetch,
    });
    await expect(client.me()).rejects.toBeInstanceOf(AmkpApiError);
  });
});
