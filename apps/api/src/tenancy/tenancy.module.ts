import { Module } from "@nestjs/common";
import {
  CreateAccountUseCase,
  CreateApiKeyUseCase,
  CreateTenantUseCase,
  ListApiKeysUseCase,
  ListTenantsByAccountUseCase,
  ResolveTenantContextUseCase,
  RevokeApiKeyUseCase,
  RotateApiKeyUseCase,
} from "@amkp/application";
import {
  createPrismaClient,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaTenantRepository,
} from "@amkp/adapters-postgres";
import { TenancyController } from "./tenancy.controller";
import { ApiKeysController } from "./api-keys.controller";
import { MeController } from "./me.controller";
import { PlatformAdminGuard } from "./platform-admin.guard";
import { TenantApiKeyGuard } from "./tenant-api-key.guard";
import { TenantContextInterceptor } from "./tenant-context.interceptor";
import {
  CREATE_ACCOUNT_UC,
  CREATE_API_KEY_UC,
  CREATE_TENANT_UC,
  LIST_API_KEYS_UC,
  LIST_TENANTS_UC,
  PRISMA,
  RESOLVE_TENANT_UC,
  REVOKE_API_KEY_UC,
  ROTATE_API_KEY_UC,
} from "./tenancy.tokens";

@Module({
  controllers: [TenancyController, ApiKeysController, MeController],
  providers: [
    PlatformAdminGuard,
    TenantApiKeyGuard,
    TenantContextInterceptor,
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
      provide: PrismaApiKeyRepository,
      useFactory: (prisma: ReturnType<typeof createPrismaClient>) =>
        new PrismaApiKeyRepository(prisma),
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
    {
      provide: CREATE_API_KEY_UC,
      useFactory: (
        tenants: PrismaTenantRepository,
        keys: PrismaApiKeyIssuer,
      ) => new CreateApiKeyUseCase(tenants, keys),
      inject: [PrismaTenantRepository, PrismaApiKeyIssuer],
    },
    {
      provide: LIST_API_KEYS_UC,
      useFactory: (
        tenants: PrismaTenantRepository,
        keys: PrismaApiKeyRepository,
      ) => new ListApiKeysUseCase(tenants, keys),
      inject: [PrismaTenantRepository, PrismaApiKeyRepository],
    },
    {
      provide: REVOKE_API_KEY_UC,
      useFactory: (
        tenants: PrismaTenantRepository,
        keys: PrismaApiKeyRepository,
      ) => new RevokeApiKeyUseCase(tenants, keys),
      inject: [PrismaTenantRepository, PrismaApiKeyRepository],
    },
    {
      provide: ROTATE_API_KEY_UC,
      useFactory: (
        tenants: PrismaTenantRepository,
        keys: PrismaApiKeyRepository,
        issuer: PrismaApiKeyIssuer,
      ) => new RotateApiKeyUseCase(tenants, keys, issuer),
      inject: [
        PrismaTenantRepository,
        PrismaApiKeyRepository,
        PrismaApiKeyIssuer,
      ],
    },
    {
      provide: RESOLVE_TENANT_UC,
      useFactory: (keys: PrismaApiKeyRepository) =>
        new ResolveTenantContextUseCase(keys),
      inject: [PrismaApiKeyRepository],
    },
  ],
})
export class TenancyModule {}
