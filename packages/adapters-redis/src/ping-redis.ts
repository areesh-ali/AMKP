import Redis from "ioredis";

/**
 * One-shot Redis PING for readiness probes.
 * Creates a short-lived connection so probes do not share app clients.
 */
export async function pingRedis(redisUrl: string): Promise<void> {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2_000,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error(`unexpected PING response: ${pong}`);
    }
  } finally {
    redis.disconnect();
  }
}

/** True when Redis is required for queue/cache outside ephemeral/test modes. */
export function redisRequiredForReady(): boolean {
  if (!process.env.REDIS_URL?.trim()) return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.AMKP_JOB_QUEUE === "memory") return false;
  if (process.env.AMKP_VECTOR_INDEX === "memory") return false;
  return true;
}
