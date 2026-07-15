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
@UseGuards(PlatformAdminGuard)
export class AuditController {
  constructor(@Inject(AUDIT_LOG) private readonly audit: AuditLogPort) {}

  @Get()
  async list(
    @Query("limit") limitRaw?: string,
    @Query("tenantId") tenantId?: string,
  ) {
    const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);
    const items = this.audit.listRecent
      ? await this.audit.listRecent(limit, {
          tenantId: tenantId?.trim() || undefined,
        })
      : [];
    return { items };
  }
}
