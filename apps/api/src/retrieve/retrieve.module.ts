import { Module } from "@nestjs/common";
import {
  RetrieveUseCase,
  VECTOR_INDEX,
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
      useFactory: (index: VectorIndexPort) => new RetrieveUseCase(index),
      inject: [VECTOR_INDEX],
    },
  ],
  exports: [RETRIEVE_UC],
})
export class RetrieveModule {}
