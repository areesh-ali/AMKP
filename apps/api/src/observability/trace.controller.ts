import {
  Controller,
  Get,
  Inject,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { GetTraceUseCase, TenantContext } from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { GET_TRACE_UC } from "../tenancy/tenancy.tokens";

@Controller("v1/traces")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class TraceController {
  constructor(
    @Inject(GET_TRACE_UC) private readonly getTrace: GetTraceUseCase,
  ) {}

  @Get(":requestId")
  async getByRequestId(
    @Req() req: RequestWithTenant,
    @Param("requestId") requestId: string,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.getTrace.execute(ctx, requestId);
  }
}
