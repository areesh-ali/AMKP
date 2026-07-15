import { Worker, type Job } from "bullmq";
import {
  ProcessIngestJobUseCase,
  type DocumentRepository,
  type IngestJobPayload,
  type JobQueuePort,
} from "@amkp/application";
import {
  createPrismaClient,
  PrismaDocumentRepository,
} from "@amkp/adapters-postgres";
import { BullMqJobQueue, QUEUE_NAMES } from "@amkp/adapters-redis";

function connectionFromUrl(redisUrl: string) {
  const u = new URL(redisUrl);
  return {
    host: u.hostname || "127.0.0.1",
    port: u.port ? Number(u.port) : 6379,
    password: u.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

async function main() {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";

  const prisma = createPrismaClient(databaseUrl);
  await prisma.$connect();

  const documents: DocumentRepository = new PrismaDocumentRepository(prisma);
  const jobs: JobQueuePort = new BullMqJobQueue(redisUrl);
  const processIngest = new ProcessIngestJobUseCase(documents, jobs);

  const connection = connectionFromUrl(redisUrl);

  const ingestWorker = new Worker(
    "ingest",
    async (job: Job<IngestJobPayload>) => {
      const { tenantId, documentId } = job.data;
      console.log(`[ingest] job=${job.id} doc=${documentId} tenant=${tenantId}`);
      const result = await processIngest.execute({ tenantId, documentId });
      console.log(`[ingest] enqueued parse job=${result.parseJobId}`);
      return result;
    },
    { connection },
  );

  const parseWorker = new Worker(
    "parse",
    async (job: Job<IngestJobPayload>) => {
      // Parse Ladder tiers land in T-2.2 — ack only for T-2.1 queue proof.
      console.log(
        `[parse] stub job=${job.id} doc=${job.data.documentId} tenant=${job.data.tenantId}`,
      );
      return { ok: true, stub: true };
    },
    { connection },
  );

  for (const w of [ingestWorker, parseWorker]) {
    w.on("failed", (job, err) => {
      console.error(`[worker] ${job?.queueName} failed`, job?.id, err);
    });
  }

  console.log("AMKP worker starting");
  console.log("queues:", QUEUE_NAMES.join(", "));
  console.log("consumers: ingest, parse (stub)");

  const shutdown = async () => {
    await ingestWorker.close();
    await parseWorker.close();
    if ("close" in jobs && typeof jobs.close === "function") {
      await (jobs as BullMqJobQueue).close();
    }
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
