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
import { performance } from "node:perf_hooks";
import type {
  MetricsPort,
  RetrieveUseCase,
  TenantContext,
  TracerPort,
} from "@amkp/application";
import { METRICS, TRACER } from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { TenantRateLimitInterceptor } from "../common/tenant-rate-limit.interceptor";
import { RETRIEVE_UC } from "../tenancy/tenancy.tokens";
import type { RequestWithId } from "../common/request-id.middleware";

class RetrieveDto {
  query!: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
}

@Controller("v1/retrieve")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor, TenantRateLimitInterceptor)
export class RetrieveController {
  constructor(
    @Inject(RETRIEVE_UC) private readonly retrieve: RetrieveUseCase,
    @Inject(METRICS) private readonly metrics: MetricsPort,
    @Inject(TRACER) private readonly tracer: TracerPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async retrieveHandler(
    @Req() req: RequestWithTenant & RequestWithId,
    @Body() body: RetrieveDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const requestId = req.requestId ?? `req_${randomUUID()}`;
    const span = this.tracer.startSpan("retrieve", {
      tenantId: ctx.tenantId,
      requestId,
    });
    const t0 = performance.now();
    try {
      const envelope = await this.retrieve.execute(
        ctx,
        {
          query: body.query,
          preferCorrectness: body.preferCorrectness === true,
          mode: body.mode === "agentic" ? "agentic" : "single_pass",
        },
        { requestId },
      );
      span.setAttribute("ok", true);
      span.setAttribute("hops", envelope.routerDecision?.hops ?? 0);
      this.metrics.observeRetrieve({
        tenantId: ctx.tenantId,
        latencyMs: performance.now() - t0,
        ok: true,
        agenticHops: envelope.routerDecision?.hops ?? 0,
        costUsd: envelope.costEstimate.estimatedUsd,
      });
      return envelope;
    } catch (err) {
      span.setAttribute("ok", false);
      this.metrics.observeRetrieve({
        tenantId: ctx.tenantId,
        latencyMs: performance.now() - t0,
        ok: false,
        agenticHops: 0,
        costUsd: 0,
      });
      throw err;
    } finally {
      span.end();
    }
  }
}
