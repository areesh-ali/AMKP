/**
 * Per-Tenant fixed-window rate limiter (MVP).
 * Configure via AMKP_RATE_LIMIT_PER_MINUTE (0 = disabled).
 */
export class TenantRateLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly limitPerMinute: number,
    private readonly windowMs = 60_000,
  ) {}

  /** @returns true if allowed */
  allow(tenantId: string, now = Date.now()): boolean {
    if (this.limitPerMinute <= 0) return true;
    const row = this.hits.get(tenantId);
    if (!row || now - row.windowStart >= this.windowMs) {
      this.hits.set(tenantId, { count: 1, windowStart: now });
      return true;
    }
    if (row.count >= this.limitPerMinute) return false;
    row.count += 1;
    return true;
  }

  clear(): void {
    this.hits.clear();
  }
}

export function createTenantRateLimiterFromEnv(): TenantRateLimiter {
  const n = Number(process.env.AMKP_RATE_LIMIT_PER_MINUTE ?? "0");
  return new TenantRateLimiter(Number.isFinite(n) ? n : 0);
}
