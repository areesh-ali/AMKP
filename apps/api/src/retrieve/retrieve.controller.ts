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
import type { RetrieveUseCase, TenantContext } from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { RETRIEVE_UC } from "../tenancy/tenancy.tokens";

class RetrieveDto {
  query!: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
}

@Controller("v1/retrieve")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class RetrieveController {
  constructor(
    @Inject(RETRIEVE_UC) private readonly retrieve: RetrieveUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async retrieveHandler(
    @Req() req: RequestWithTenant,
    @Body() body: RetrieveDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    return this.retrieve.execute(
      ctx,
      {
        query: body.query,
        preferCorrectness: body.preferCorrectness === true,
        mode: body.mode === "agentic" ? "agentic" : "single_pass",
      },
      { requestId: `req_${randomUUID()}` },
    );
  }
}
