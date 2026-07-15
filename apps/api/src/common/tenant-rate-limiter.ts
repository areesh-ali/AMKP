export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
}

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

  take(tenantId: string, now = Date.now()): RateLimitDecision {
    if (this.limitPerMinute <= 0) {
      return {
        allowed: true,
        limit: 0,
        remaining: Number.POSITIVE_INFINITY,
        resetAt: now + this.windowMs,
      };
    }

    let row = this.hits.get(tenantId);
    if (!row || now - row.windowStart >= this.windowMs) {
      row = { count: 0, windowStart: now };
      this.hits.set(tenantId, row);
    }

    const resetAt = row.windowStart + this.windowMs;
    if (row.count >= this.limitPerMinute) {
      return {
        allowed: false,
        limit: this.limitPerMinute,
        remaining: 0,
        resetAt,
      };
    }

    row.count += 1;
    return {
      allowed: true,
      limit: this.limitPerMinute,
      remaining: Math.max(0, this.limitPerMinute - row.count),
      resetAt,
    };
  }

  /** @deprecated prefer take() for header metadata */
  allow(tenantId: string, now = Date.now()): boolean {
    return this.take(tenantId, now).allowed;
  }

  clear(): void {
    this.hits.clear();
  }
}

export function createTenantRateLimiterFromEnv(): TenantRateLimiter {
  const n = Number(process.env.AMKP_RATE_LIMIT_PER_MINUTE ?? "0");
  return new TenantRateLimiter(Number.isFinite(n) ? n : 0);
}
