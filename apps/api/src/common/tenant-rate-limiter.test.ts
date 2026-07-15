import { describe, expect, it } from "vitest";
import { TenantRateLimiter } from "./tenant-rate-limiter";

describe("TenantRateLimiter", () => {
  it("allows when disabled", () => {
    const lim = new TenantRateLimiter(0);
    expect(lim.allow("ten_a")).toBe(true);
    expect(lim.allow("ten_a")).toBe(true);
  });

  it("isolates tenants and enforces window", () => {
    const lim = new TenantRateLimiter(2, 60_000);
    const t0 = 1_000_000;
    expect(lim.allow("ten_a", t0)).toBe(true);
    expect(lim.allow("ten_a", t0 + 1)).toBe(true);
    expect(lim.allow("ten_a", t0 + 2)).toBe(false);
    expect(lim.allow("ten_b", t0 + 2)).toBe(true);
    expect(lim.allow("ten_a", t0 + 60_000)).toBe(true);
  });

  it("exposes remaining and reset via take()", () => {
    const lim = new TenantRateLimiter(2, 60_000);
    const t0 = 5_000_000;
    const first = lim.take("ten_a", t0);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(first.resetAt).toBe(t0 + 60_000);

    lim.take("ten_a", t0 + 1);
    const blocked = lim.take("ten_a", t0 + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
