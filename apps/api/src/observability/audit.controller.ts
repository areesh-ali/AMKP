import {
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AUDIT_LOG, type AuditLogPort } from "@amkp/application";
import { PlatformAdminGuard } from "../tenancy/platform-admin.guard";

@Controller("v1/audit")
export class AuditController {
  constructor(@Inject(AUDIT_LOG) private readonly audit: AuditLogPort) {}

  @Get()
  @UseGuards(PlatformAdminGuard)
  async listRecent(@Query("limit") limitRaw?: string) {
    const limit = limitRaw ? Number(limitRaw) : 50;
    const items = this.audit.listRecent
      ? await this.audit.listRecent(Number.isFinite(limit) ? limit : 50)
      : [];
    return { items };
  }
}
