import { Module } from "@nestjs/common";
import {
  RetrieveUseCase,
  RETRIEVE_CACHE,
  TENANT_REPOSITORY,
  TRACE_REPOSITORY,
  VECTOR_INDEX,
  type RetrieveCachePort,
  type TenantRepository,
  type TraceRepository,
  type VectorIndexPort,
} from "@amkp/application";
import { PersistenceModule } from "../infrastructure/persistence.module";
import { AuthModule } from "../auth/auth.module";
import { RetrieveController } from "./retrieve.controller";
import { RETRIEVE_UC } from "../tenancy/tenancy.tokens";

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [RetrieveController],
  providers: [
    {
      provide: RETRIEVE_UC,
      useFactory: (
        index: VectorIndexPort,
        tenants: TenantRepository,
        cache: RetrieveCachePort,
        traces: TraceRepository,
      ) => new RetrieveUseCase(index, tenants, cache, traces),
      inject: [VECTOR_INDEX, TENANT_REPOSITORY, RETRIEVE_CACHE, TRACE_REPOSITORY],
    },
  ],
  exports: [RETRIEVE_UC],
})
export class RetrieveModule {}
