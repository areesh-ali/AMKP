import { Module } from "@nestjs/common";
import {
  RetrieveUseCase,
  TENANT_REPOSITORY,
  VECTOR_INDEX,
  type TenantRepository,
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
      useFactory: (index: VectorIndexPort, tenants: TenantRepository) =>
        new RetrieveUseCase(index, tenants),
      inject: [VECTOR_INDEX, TENANT_REPOSITORY],
    },
  ],
  exports: [RETRIEVE_UC],
})
export class RetrieveModule {}
