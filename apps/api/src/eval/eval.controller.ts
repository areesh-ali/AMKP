import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  RunGoldenEvalUseCase,
  RunTableRankAblationUseCase,
  TenantContext,
} from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import {
  RUN_GOLDEN_EVAL_UC,
  RUN_TABLE_RANK_EVAL_UC,
} from "../tenancy/tenancy.tokens";

class GoldenEvalDto {
  questions!: Array<{
    id: string;
    question: string;
    expectedDocumentIds?: string[];
    expectedKeywords?: string[];
  }>;
  judge?: { kind: "lexical_stub" | "llm"; modelId?: string };
}

class TableRankEvalDto {
  queries!: string[];
}

@Controller("v1/eval")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class EvalController {
  constructor(
    @Inject(RUN_GOLDEN_EVAL_UC)
    private readonly runGolden: RunGoldenEvalUseCase,
    @Inject(RUN_TABLE_RANK_EVAL_UC)
    private readonly runTableRank: RunTableRankAblationUseCase,
  ) {}

  @Post("golden-set")
  @HttpCode(HttpStatus.OK)
  async goldenSet(
    @Req() req: RequestWithTenant,
    @Body() body: GoldenEvalDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.runGolden.execute(
      ctx,
      { questions: body.questions ?? [], judge: body.judge },
      { requestId: `eval_${randomUUID()}` },
    );
  }

  @Post("table-rank")
  @HttpCode(HttpStatus.OK)
  async tableRank(
    @Req() req: RequestWithTenant,
    @Body() body: TableRankEvalDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.runTableRank.execute(
      ctx,
      { queries: body.queries ?? [] },
      { requestId: `tablerank_${randomUUID()}` },
    );
  }
}
