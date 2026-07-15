import { Module } from "@nestjs/common";
import {
  GetTraceUseCase,
  TRACE_REPOSITORY,
  type TraceRepository,
} from "@amkp/application";
import { AuthModule } from "../auth/auth.module";
import { PersistenceModule } from "../infrastructure/persistence.module";
import { GET_TRACE_UC } from "../tenancy/tenancy.tokens";
import { TraceController } from "./trace.controller";

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [TraceController],
  providers: [
    {
      provide: GET_TRACE_UC,
      useFactory: (traces: TraceRepository) => new GetTraceUseCase(traces),
      inject: [TRACE_REPOSITORY],
    },
  ],
})
export class ObservabilityModule {}
