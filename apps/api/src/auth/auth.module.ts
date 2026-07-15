import { Module } from "@nestjs/common";
import {
  API_KEY_REPOSITORY,
  ResolveTenantContextUseCase,
  type ApiKeyRepository,
} from "@amkp/application";
import { PersistenceModule } from "../infrastructure/persistence.module";
import { TenantApiKeyGuard } from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { RESOLVE_TENANT_UC } from "../tenancy/tenancy.tokens";

/**
 * Shared Product auth (Bearer API key → TenantContext).
 * Imported by any module that exposes Tenant-scoped HTTP routes.
 */
@Module({
  imports: [PersistenceModule],
  providers: [
    TenantApiKeyGuard,
    TenantContextInterceptor,
    {
      provide: RESOLVE_TENANT_UC,
      useFactory: (keys: ApiKeyRepository) =>
        new ResolveTenantContextUseCase(keys),
      inject: [API_KEY_REPOSITORY],
    },
  ],
  exports: [TenantApiKeyGuard, TenantContextInterceptor, RESOLVE_TENANT_UC],
})
export class AuthModule {}
