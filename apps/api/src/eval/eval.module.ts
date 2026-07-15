import { Module } from "@nestjs/common";
import {
  RunGoldenEvalUseCase,
  RunTableRankAblationUseCase,
  type RetrieveUseCase,
} from "@amkp/application";
import { AuthModule } from "../auth/auth.module";
import { RetrieveModule } from "../retrieve/retrieve.module";
import {
  RETRIEVE_UC,
  RUN_GOLDEN_EVAL_UC,
  RUN_TABLE_RANK_EVAL_UC,
} from "../tenancy/tenancy.tokens";
import { EvalController } from "./eval.controller";

@Module({
  imports: [AuthModule, RetrieveModule],
  controllers: [EvalController],
  providers: [
    {
      provide: RUN_GOLDEN_EVAL_UC,
      useFactory: (retrieve: RetrieveUseCase) =>
        new RunGoldenEvalUseCase(retrieve),
      inject: [RETRIEVE_UC],
    },
    {
      provide: RUN_TABLE_RANK_EVAL_UC,
      useFactory: (retrieve: RetrieveUseCase) =>
        new RunTableRankAblationUseCase(retrieve),
      inject: [RETRIEVE_UC],
    },
  ],
})
export class EvalModule {}
