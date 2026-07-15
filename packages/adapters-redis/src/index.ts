import { Queue } from "bullmq";
import type {
  EnqueueResult,
  IngestJobPayload,
  JobQueuePort,
  QueueName,
} from "@amkp/application";
import { QUEUE_NAMES } from "./queues";

export { QUEUE_NAMES, type QueueName as RedisQueueName } from "./queues";

function connectionFromUrl(redisUrl: string) {
  const u = new URL(redisUrl);
  return {
    host: u.hostname || "127.0.0.1",
    port: u.port ? Number(u.port) : 6379,
    password: u.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

export class BullMqJobQueue implements JobQueuePort {
  private readonly queues = new Map<QueueName, Queue>();

  constructor(private readonly redisUrl: string) {
    for (const name of QUEUE_NAMES) {
      this.queues.set(
        name,
        new Queue(name, { connection: connectionFromUrl(redisUrl) }),
      );
    }
  }

  async enqueue(
    queue: QueueName,
    payload: IngestJobPayload,
    options?: { jobId?: string },
  ): Promise<EnqueueResult> {
    const q = this.queues.get(queue);
    if (!q) {
      throw new Error(`Unknown queue: ${queue}`);
    }
    const job = await q.add("process", payload, {
      jobId: options?.jobId,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return { jobId: String(job.id), queue };
  }

  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}

/** Test double — records jobs in memory; does not require Redis. */
export class InMemoryJobQueue implements JobQueuePort {
  readonly jobs: Array<{
    queue: QueueName;
    payload: IngestJobPayload;
    jobId: string;
  }> = [];

  async enqueue(
    queue: QueueName,
    payload: IngestJobPayload,
    options?: { jobId?: string },
  ): Promise<EnqueueResult> {
    const jobId = options?.jobId ?? `job_mem_${this.jobs.length + 1}`;
    this.jobs.push({ queue, payload, jobId });
    return { jobId, queue };
  }
}

export function createJobQueue(redisUrl?: string): JobQueuePort {
  if (redisUrl && redisUrl.length > 0 && process.env.AMKP_JOB_QUEUE !== "memory") {
    return new BullMqJobQueue(redisUrl);
  }
  return new InMemoryJobQueue();
}

export { InMemoryTenantRetrieveCache } from "./retrieve-cache";
export { RedisTenantRetrieveCache } from "./redis-retrieve-cache";
export { pingRedis, redisRequiredForReady } from "./ping-redis";
