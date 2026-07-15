import { Module } from "@nestjs/common";
import {
  ACCOUNT_REPOSITORY,
  API_KEY_ISSUER,
  API_KEY_REPOSITORY,
  CreateAccountUseCase,
  CreateApiKeyUseCase,
  CreateTenantUseCase,
  ListApiKeysUseCase,
  ListTenantsByAccountUseCase,
  ResolveTenantContextUseCase,
  RevokeApiKeyUseCase,
  RotateApiKeyUseCase,
  TENANT_REPOSITORY,
  type AccountRepository,
  type ApiKeyIssuer,
  type ApiKeyRepository,
  type TenantRepository,
} from "@amkp/application";
import { PersistenceModule } from "../infrastructure/persistence.module";
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
  RESOLVE_TENANT_UC,
  REVOKE_API_KEY_UC,
  ROTATE_API_KEY_UC,
} from "./tenancy.tokens";

@Module({
  imports: [PersistenceModule],
  controllers: [TenancyController, ApiKeysController, MeController],
  providers: [
    PlatformAdminGuard,
    TenantApiKeyGuard,
    TenantContextInterceptor,
    {
      provide: CREATE_ACCOUNT_UC,
      useFactory: (accounts: AccountRepository) =>
        new CreateAccountUseCase(accounts),
      inject: [ACCOUNT_REPOSITORY],
    },
    {
      provide: CREATE_TENANT_UC,
      useFactory: (
        accounts: AccountRepository,
        tenants: TenantRepository,
        keys: ApiKeyIssuer,
      ) => new CreateTenantUseCase(accounts, tenants, keys),
      inject: [ACCOUNT_REPOSITORY, TENANT_REPOSITORY, API_KEY_ISSUER],
    },
    {
      provide: LIST_TENANTS_UC,
      useFactory: (accounts: AccountRepository, tenants: TenantRepository) =>
        new ListTenantsByAccountUseCase(accounts, tenants),
      inject: [ACCOUNT_REPOSITORY, TENANT_REPOSITORY],
    },
    {
      provide: CREATE_API_KEY_UC,
      useFactory: (tenants: TenantRepository, keys: ApiKeyIssuer) =>
        new CreateApiKeyUseCase(tenants, keys),
      inject: [TENANT_REPOSITORY, API_KEY_ISSUER],
    },
    {
      provide: LIST_API_KEYS_UC,
      useFactory: (tenants: TenantRepository, keys: ApiKeyRepository) =>
        new ListApiKeysUseCase(tenants, keys),
      inject: [TENANT_REPOSITORY, API_KEY_REPOSITORY],
    },
    {
      provide: REVOKE_API_KEY_UC,
      useFactory: (tenants: TenantRepository, keys: ApiKeyRepository) =>
        new RevokeApiKeyUseCase(tenants, keys),
      inject: [TENANT_REPOSITORY, API_KEY_REPOSITORY],
    },
    {
      provide: ROTATE_API_KEY_UC,
      useFactory: (
        tenants: TenantRepository,
        keys: ApiKeyRepository,
        issuer: ApiKeyIssuer,
      ) => new RotateApiKeyUseCase(tenants, keys, issuer),
      inject: [TENANT_REPOSITORY, API_KEY_REPOSITORY, API_KEY_ISSUER],
    },
    {
      provide: RESOLVE_TENANT_UC,
      useFactory: (keys: ApiKeyRepository) =>
        new ResolveTenantContextUseCase(keys),
      inject: [API_KEY_REPOSITORY],
    },
  ],
})
export class TenancyModule {}
