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
import {
  TENANT_REPOSITORY,
  type RetrieveUseCase,
  type TenantContext,
  type TenantRepository,
} from "@amkp/application";
import {
  TenantApiKeyGuard,
  type RequestWithTenant,
} from "../tenancy/tenant-api-key.guard";
import { TenantContextInterceptor } from "../tenancy/tenant-context.interceptor";
import { RETRIEVE_UC } from "../tenancy/tenancy.tokens";

class RetrieveDto {
  query!: string;
}

@Controller("v1/retrieve")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class RetrieveController {
  constructor(
    @Inject(RETRIEVE_UC) private readonly retrieve: RetrieveUseCase,
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async retrieveHandler(
    @Req() req: RequestWithTenant,
    @Body() body: RetrieveDto,
  ) {
    const ctx = req.tenantContext as TenantContext;
    const tenant = await this.tenants.findById(ctx.tenantId);
    const namespace = tenant?.vectorNamespace ?? "";
    return this.retrieve.execute(
      ctx,
      { query: body.query },
      {
        requestId: `req_${randomUUID()}`,
        namespace,
      },
    );
  }
}
