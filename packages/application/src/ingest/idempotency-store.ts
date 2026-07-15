/**
 * Tenant-scoped Idempotency-Key store for ingest (and similar) retries.
 * Keys never cross Tenants.
 */
export interface IdempotencyStore {
  get(tenantId: string, key: string): Promise<string | null>;
  /** Store JSON response body. Overwrites existing. */
  set(
    tenantId: string,
    key: string,
    bodyJson: string,
    ttlSeconds: number,
  ): Promise<void>;
}

export const IDEMPOTENCY_STORE = Symbol("IDEMPOTENCY_STORE");

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<
    string,
    { body: string; expiresAt: number }
  >();

  private k(tenantId: string, key: string): string {
    return `${tenantId}:${key}`;
  }

  async get(tenantId: string, key: string): Promise<string | null> {
    const row = this.map.get(this.k(tenantId, key));
    if (!row) return null;
    if (Date.now() > row.expiresAt) {
      this.map.delete(this.k(tenantId, key));
      return null;
    }
    return row.body;
  }

  async set(
    tenantId: string,
    key: string,
    bodyJson: string,
    ttlSeconds: number,
  ): Promise<void> {
    this.map.set(this.k(tenantId, key), {
      body: bodyJson,
      expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });
  }
}
