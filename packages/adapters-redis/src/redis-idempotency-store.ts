import Redis from "ioredis";
import type { IdempotencyStore } from "@amkp/application";
import { InMemoryIdempotencyStore } from "@amkp/application";

/**
 * Redis Idempotency-Key store — keys always include tenantId.
 */
export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(redisUrl: string, options?: { keyPrefix?: string }) {
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    this.prefix = options?.keyPrefix ?? "amkp:idempotency:";
  }

  private redisKey(tenantId: string, key: string): string {
    return `${this.prefix}${tenantId}:${key}`;
  }

  async get(tenantId: string, key: string): Promise<string | null> {
    return this.redis.get(this.redisKey(tenantId, key));
  }

  async set(
    tenantId: string,
    key: string,
    bodyJson: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.redisKey(tenantId, key),
      bodyJson,
      "EX",
      Math.max(1, ttlSeconds),
    );
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export function createIdempotencyStoreFromEnv(): IdempotencyStore {
  const ephemeral =
    process.env.NODE_ENV === "test" ||
    process.env.AMKP_JOB_QUEUE === "memory" ||
    process.env.AMKP_VECTOR_INDEX === "memory";
  const url = process.env.REDIS_URL?.trim();
  if (!ephemeral && url) {
    return new RedisIdempotencyStore(url);
  }
  return new InMemoryIdempotencyStore();
}
