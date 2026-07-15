import { Module } from "@nestjs/common";
import {
  ACCOUNT_REPOSITORY,
  API_KEY_ISSUER,
  API_KEY_REPOSITORY,
  TENANT_REPOSITORY,
  VECTOR_INDEX,
} from "@amkp/application";
import {
  createPrismaClient,
  InMemoryVectorIndex,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaTenantRepository,
} from "@amkp/adapters-postgres";
import { PRISMA } from "../tenancy/tenancy.tokens";
import { PrismaModule } from "./prisma.module";

type Prisma = ReturnType<typeof createPrismaClient>;

/** Shared singleton so isolation tests plant chunks into the Nest-bound index. */
export const sharedVectorIndex = new InMemoryVectorIndex();

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
      provide: VECTOR_INDEX,
      useValue: sharedVectorIndex,
    },
  ],
  exports: [
    ACCOUNT_REPOSITORY,
    TENANT_REPOSITORY,
    API_KEY_ISSUER,
    API_KEY_REPOSITORY,
    VECTOR_INDEX,
  ],
})
export class PersistenceModule {}
