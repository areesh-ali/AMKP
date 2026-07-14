import { Module } from "@nestjs/common";
import {
  CreateAccountUseCase,
  CreateTenantUseCase,
  ListTenantsByAccountUseCase,
} from "@amkp/application";
import {
  createPrismaClient,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaTenantRepository,
} from "@amkp/adapters-postgres";
import { TenancyController } from "./tenancy.controller";
import { PlatformAdminGuard } from "./platform-admin.guard";
import {
  CREATE_ACCOUNT_UC,
  CREATE_TENANT_UC,
  LIST_TENANTS_UC,
  PRISMA,
} from "./tenancy.tokens";

@Module({
  controllers: [TenancyController],
  providers: [
    PlatformAdminGuard,
    {
      provide: PRISMA,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error("DATABASE_URL is required");
        }
        return createPrismaClient(url);
      },
    },
    {
      provide: PrismaAccountRepository,
      useFactory: (prisma: ReturnType<typeof createPrismaClient>) =>
        new PrismaAccountRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: PrismaTenantRepository,
      useFactory: (prisma: ReturnType<typeof createPrismaClient>) =>
        new PrismaTenantRepository(prisma),
      inject: [PRISMA],
    },
    {
      provide: PrismaApiKeyIssuer,
      useFactory: (prisma: ReturnType<typeof createPrismaClient>) =>
        new PrismaApiKeyIssuer(prisma),
      inject: [PRISMA],
    },
    {
      provide: CREATE_ACCOUNT_UC,
      useFactory: (accounts: PrismaAccountRepository) =>
        new CreateAccountUseCase(accounts),
      inject: [PrismaAccountRepository],
    },
    {
      provide: CREATE_TENANT_UC,
      useFactory: (
        accounts: PrismaAccountRepository,
        tenants: PrismaTenantRepository,
        keys: PrismaApiKeyIssuer,
      ) => new CreateTenantUseCase(accounts, tenants, keys),
      inject: [
        PrismaAccountRepository,
        PrismaTenantRepository,
        PrismaApiKeyIssuer,
      ],
    },
    {
      provide: LIST_TENANTS_UC,
      useFactory: (
        accounts: PrismaAccountRepository,
        tenants: PrismaTenantRepository,
      ) => new ListTenantsByAccountUseCase(accounts, tenants),
      inject: [PrismaAccountRepository, PrismaTenantRepository],
    },
  ],
})
export class TenancyModule {}
