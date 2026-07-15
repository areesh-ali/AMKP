import { createServer } from "node:http";
import { Worker, type Job } from "bullmq";
import {
  ProcessIngestJobUseCase,
  ProcessParseJobUseCase,
  InMemoryVectorIndex,
  type DocumentRepository,
  type ChunkRepository,
  type IngestJobPayload,
  type JobQueuePort,
  type ParseLadderPort,
  type VectorIndexPort,
} from "@amkp/application";
import {
  createPrismaClient,
  PostgresVectorIndex,
  PrismaChunkRepository,
  PrismaDocumentRepository,
  PrismaTenantRepository,
  createObjectStorageFromEnv,
} from "@amkp/adapters-postgres";
import {
  LocalParseLadder,
  createEmbeddingProviderFromEnv,
  createPageVisionProviderFromEnv,
  createDocumentStatusNotifierFromEnv,
  startAmkpOtel,
} from "@amkp/adapters-providers";
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
  const shutdownOtel = await startAmkpOtel({ serviceName: "amkp-worker" });

  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";

  const prisma = createPrismaClient(databaseUrl);
  await prisma.$connect();

  const documents: DocumentRepository = new PrismaDocumentRepository(
    prisma,
    createObjectStorageFromEnv(),
  );
  const chunks: ChunkRepository = new PrismaChunkRepository(prisma);
  const tenants = new PrismaTenantRepository(prisma);
  const jobs: JobQueuePort = new BullMqJobQueue(redisUrl);
  const ladder: ParseLadderPort = new LocalParseLadder(
    undefined,
    createPageVisionProviderFromEnv(),
  );
  const embedder = createEmbeddingProviderFromEnv();
  const index: VectorIndexPort =
    process.env.AMKP_VECTOR_INDEX === "memory"
      ? new InMemoryVectorIndex()
      : new PostgresVectorIndex(prisma, embedder);

  const processIngest = new ProcessIngestJobUseCase(documents, jobs);
  const statusNotifier = createDocumentStatusNotifierFromEnv();
  const processParse = new ProcessParseJobUseCase(
    documents,
    chunks,
    ladder,
    index,
    tenants,
    statusNotifier,
  );

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
      const { tenantId, documentId } = job.data;
      console.log(`[parse] job=${job.id} doc=${documentId} tenant=${tenantId}`);
      try {
        const result = await processParse.execute({ tenantId, documentId });
        console.log(
          `[parse] tier=${result.parseTier} chunks=${result.chunkCount} vlm=${result.usedVlm}`,
        );
        return result;
      } catch (err) {
        try {
          await documents.updateStatus(tenantId, documentId, "failed");
        } catch {
          /* best-effort status */
        }
        await statusNotifier?.notify({
          tenantId,
          documentId,
          status: "failed",
        });
        throw err;
      }
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
  console.log(
    "vector index:",
    process.env.AMKP_VECTOR_INDEX === "memory" ? "memory" : "postgres+pgvector",
  );
  console.log("consumers: ingest, parse (tiers 1–2)");

  const healthPort = Number(process.env.WORKER_HEALTH_PORT ?? 3001);
  const health = createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "worker" }));
      return;
    }
    if (req.url === "/ready") {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, service: "worker", database: "up" }));
      } catch {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: {
              code: "NOT_READY",
              message: "database unavailable",
              request_id: "worker_ready",
            },
          }),
        );
      }
      return;
    }
    res.writeHead(404).end();
  });
  health.listen(healthPort, () => {
    console.log(`worker health on :${healthPort}`);
  });

  const shutdown = async () => {
    health.close();
    await ingestWorker.close();
    await parseWorker.close();
    if ("close" in jobs && typeof jobs.close === "function") {
      await (jobs as BullMqJobQueue).close();
    }
    await prisma.$disconnect();
    await shutdownOtel();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
