import Redis from "ioredis";
import type { EvidenceEnvelope, TenantId } from "@amkp/domain";
import type { RetrieveCachePort } from "@amkp/application";
import { InMemoryTenantRetrieveCache } from "./retrieve-cache";

const DEFAULT_TTL_SECONDS = 300;

/**
 * Redis retrieve cache with mandatory tenant_id in the key (T-5.2 / FR-16).
 * Keys never cross Tenants — even for identical query text.
 */
export class RedisTenantRetrieveCache implements RetrieveCachePort {
  private readonly redis: Redis;
  private readonly ttlSeconds: number;
  private readonly prefix: string;

  constructor(
    redisUrl: string,
    options?: { ttlSeconds?: number; keyPrefix?: string },
  ) {
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    this.ttlSeconds = options?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    this.prefix = options?.keyPrefix ?? "amkp:retrieve:";
  }

  private redisKey(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
  }): string {
    return this.prefix + InMemoryTenantRetrieveCache.key(input);
  }

  async get(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
  }): Promise<EvidenceEnvelope | null> {
    const raw = await this.redis.get(this.redisKey(input));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as EvidenceEnvelope;
    } catch {
      return null;
    }
  }

  async set(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
    envelope: EvidenceEnvelope;
  }): Promise<void> {
    await this.redis.set(
      this.redisKey(input),
      JSON.stringify(input.envelope),
      "EX",
      this.ttlSeconds,
    );
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  async clearTenant(tenantId: TenantId): Promise<void> {
    const pattern = `${this.prefix}tenant:${tenantId}|*`;
    let cursor = "0";
    do {
      const [next, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = next;
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }
}
