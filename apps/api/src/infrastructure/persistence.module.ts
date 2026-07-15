import { Module } from "@nestjs/common";
import {
  ACCOUNT_REPOSITORY,
  API_KEY_ISSUER,
  API_KEY_REPOSITORY,
  CHUNK_REPOSITORY,
  DOCUMENT_REPOSITORY,
  JOB_QUEUE,
  PARSE_LADDER,
  RETRIEVE_CACHE,
  TENANT_REPOSITORY,
  TRACE_REPOSITORY,
  AUDIT_LOG,
  METRICS,
  VECTOR_INDEX,
  InMemoryAuditLog,
  InMemoryMetrics,
} from "@amkp/application";
import {
  createPrismaClient,
  InMemoryTraceRepository,
  InMemoryVectorIndex,
  LocalFsObjectStorage,
  PostgresVectorIndex,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaAuditLog,
  PrismaChunkRepository,
  PrismaDocumentRepository,
  PrismaTenantRepository,
  PrismaTraceRepository,
} from "@amkp/adapters-postgres";
import {
  StubEmbeddingProvider,
  LocalParseLadder,
  createPageVisionLedger,
} from "@amkp/adapters-providers";
import {
  createJobQueue,
  InMemoryJobQueue,
  InMemoryTenantRetrieveCache,
  RedisTenantRetrieveCache,
} from "@amkp/adapters-redis";
import { PRISMA } from "../tenancy/tenancy.tokens";
import { PrismaModule } from "./prisma.module";

type Prisma = ReturnType<typeof createPrismaClient>;

/** Shared singleton so isolation tests plant chunks into the Nest-bound index. */
export const sharedVectorIndex = new InMemoryVectorIndex();

/**
 * Shared queue for tests / memory mode. When REDIS_URL is set and
 * AMKP_JOB_QUEUE !== "memory", BullMQ is used instead.
 */
export const sharedMemoryJobQueue = new InMemoryJobQueue();

/** Shared tenant-keyed retrieve cache (T-5.2) — tests / memory mode. */
export const sharedRetrieveCache = new InMemoryTenantRetrieveCache();

/** Shared Trace store (T-6.1) — tests / memory mode. */
export const sharedTraceRepository = new InMemoryTraceRepository();

/** Shared audit log (T-4.2) — tests / memory mode. */
export const sharedAuditLog = new InMemoryAuditLog();

/** Shared Prometheus metrics (T-6.2). */
export const sharedMetrics = new InMemoryMetrics();

/** Shared VLM spend ledger for asserting page-vision opt-in (T-2.4). */
export const sharedPageVisionLedger = createPageVisionLedger();
export const sharedParseLadder = new LocalParseLadder(sharedPageVisionLedger);
export const sharedEmbeddingProvider = new StubEmbeddingProvider();

function useEphemeralAdapters(): boolean {
  return (
    process.env.AMKP_VECTOR_INDEX === "memory" ||
    process.env.NODE_ENV === "test" ||
    process.env.AMKP_JOB_QUEUE === "memory"
  );
}

function createObjectStorage() {
  const dir = process.env.AMKP_OBJECT_STORAGE_DIR?.trim();
  if (!dir) return undefined;
  return new LocalFsObjectStorage(dir);
}

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (prisma: Prisma) => new PrismaAccountRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: TENANT_REPOSITORY,
      useFactory: (prisma: Prisma) => new PrismaTenantRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: API_KEY_ISSUER,
      useFactory: (prisma: Prisma) => new PrismaApiKeyIssuer(prisma),
      inject: [PRISMA],
    },
    {
      provide: API_KEY_REPOSITORY,
      useFactory: (prisma: Prisma) => new PrismaApiKeyRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: DOCUMENT_REPOSITORY,
      useFactory: (prisma: Prisma) =>
        new PrismaDocumentRepository(prisma, createObjectStorage()),
      inject: [PRISMA],
    },
    {
      provide: CHUNK_REPOSITORY,
      useFactory: (prisma: Prisma) => new PrismaChunkRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: PARSE_LADDER,
      useValue: sharedParseLadder,
    },
    {
      provide: VECTOR_INDEX,
      useFactory: (prisma: Prisma) => {
        if (useEphemeralAdapters()) {
          return sharedVectorIndex;
        }
        return new PostgresVectorIndex(prisma, sharedEmbeddingProvider);
      },
      inject: [PRISMA],
    },
    {
      provide: RETRIEVE_CACHE,
      useFactory: () => {
        if (useEphemeralAdapters() || !process.env.REDIS_URL) {
          return sharedRetrieveCache;
        }
        return new RedisTenantRetrieveCache(process.env.REDIS_URL);
      },
    },
    {
      provide: TRACE_REPOSITORY,
      useFactory: (prisma: Prisma) => {
        if (useEphemeralAdapters()) {
          return sharedTraceRepository;
        }
        return new PrismaTraceRepository(prisma);
      },
      inject: [PRISMA],
    },
    {
      provide: AUDIT_LOG,
      useFactory: (prisma: Prisma) => {
        if (useEphemeralAdapters()) {
          return sharedAuditLog;
        }
        return new PrismaAuditLog(prisma);
      },
      inject: [PRISMA],
    },
    {
      provide: METRICS,
      useValue: sharedMetrics,
    },
    {
      provide: JOB_QUEUE,
      useFactory: () => {
        if (
          process.env.AMKP_JOB_QUEUE === "memory" ||
          process.env.NODE_ENV === "test" ||
          !process.env.REDIS_URL
        ) {
          return sharedMemoryJobQueue;
        }
        return createJobQueue(process.env.REDIS_URL);
      },
    },
  ],
  exports: [
    ACCOUNT_REPOSITORY,
    TENANT_REPOSITORY,
    API_KEY_ISSUER,
    API_KEY_REPOSITORY,
    DOCUMENT_REPOSITORY,
    CHUNK_REPOSITORY,
    PARSE_LADDER,
    VECTOR_INDEX,
    RETRIEVE_CACHE,
    TRACE_REPOSITORY,
    AUDIT_LOG,
    METRICS,
    JOB_QUEUE,
  ],
})
export class PersistenceModule {}
