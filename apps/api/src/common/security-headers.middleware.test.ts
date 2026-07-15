import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { securityHeadersMiddleware } from "./security-headers.middleware";

function mockRes() {
  const headers = new Map<string, string>();
  return {
    headers,
    setHeader(k: string, v: string) {
      headers.set(k, v);
    },
  } as unknown as Response & { headers: Map<string, string> };
}

describe("securityHeadersMiddleware", () => {
  it("sets baseline headers", () => {
    const res = mockRes();
    securityHeadersMiddleware({} as Request, res, () => {});
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("same-site");
    expect(res.headers.has("Strict-Transport-Security")).toBe(false);
  });

  it("emits HSTS when enabled", () => {
    const prev = process.env.AMKP_HSTS;
    process.env.AMKP_HSTS = "1";
    const res = mockRes();
    securityHeadersMiddleware({} as Request, res, () => {});
    expect(res.headers.get("Strict-Transport-Security")).toMatch(/max-age=/);
    if (prev === undefined) delete process.env.AMKP_HSTS;
    else process.env.AMKP_HSTS = prev;
  });
});
