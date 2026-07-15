import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { requireTenantContext } from "@amkp/application";
import { TenantApiKeyGuard, type RequestWithTenant } from "./tenant-api-key.guard";
import { TenantContextInterceptor } from "./tenant-context.interceptor";

@Controller("v1/me")
@UseGuards(TenantApiKeyGuard)
@UseInterceptors(TenantContextInterceptor)
export class MeController {
  @Get()
  getMe(@Req() req: RequestWithTenant) {
    const ctx = req.tenantContext ?? requireTenantContext();
    return { tenantId: ctx.tenantId, accountId: ctx.accountId };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  postMe(@Req() req: RequestWithTenant, @Body() _body: Record<string, unknown>) {
    const ctx = req.tenantContext ?? requireTenantContext();
    return { tenantId: ctx.tenantId, accountId: ctx.accountId };
  }
}
