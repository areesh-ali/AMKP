import { Module } from "@nestjs/common";
import {
  ACCOUNT_REPOSITORY,
  API_KEY_ISSUER,
  API_KEY_REPOSITORY,
  TENANT_REPOSITORY,
} from "@amkp/application";
import {
  createPrismaClient,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaTenantRepository,
} from "@amkp/adapters-postgres";
import { PRISMA } from "../tenancy/tenancy.tokens";
import { PrismaModule } from "../infrastructure/prisma.module";

type Prisma = ReturnType<typeof createPrismaClient>;

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
  ],
  exports: [
    ACCOUNT_REPOSITORY,
    TENANT_REPOSITORY,
    API_KEY_ISSUER,
    API_KEY_REPOSITORY,
  ],
})
export class PersistenceModule {}
