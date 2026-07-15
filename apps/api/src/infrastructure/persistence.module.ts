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
  VECTOR_INDEX,
} from "@amkp/application";
import {
  createPrismaClient,
  InMemoryTraceRepository,
  InMemoryVectorIndex,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaChunkRepository,
  PrismaDocumentRepository,
  PrismaTenantRepository,
} from "@amkp/adapters-postgres";
import { LocalParseLadder, createPageVisionLedger } from "@amkp/adapters-providers";
import {
  createJobQueue,
  InMemoryJobQueue,
  InMemoryTenantRetrieveCache,
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

/** Shared tenant-keyed retrieve cache (T-5.2). */
export const sharedRetrieveCache = new InMemoryTenantRetrieveCache();

/** Shared Trace store (T-6.1 MVP in-memory). */
export const sharedTraceRepository = new InMemoryTraceRepository();

/** Shared VLM spend ledger for asserting page-vision opt-in (T-2.4). */
export const sharedPageVisionLedger = createPageVisionLedger();
export const sharedParseLadder = new LocalParseLadder(sharedPageVisionLedger);
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
      useFactory: (prisma: Prisma) => new PrismaDocumentRepository(prisma),
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
      useValue: sharedVectorIndex,
    },
    {
      provide: RETRIEVE_CACHE,
      useValue: sharedRetrieveCache,
    },
    {
      provide: TRACE_REPOSITORY,
      useValue: sharedTraceRepository,
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
    JOB_QUEUE,
  ],
})
export class PersistenceModule {}
