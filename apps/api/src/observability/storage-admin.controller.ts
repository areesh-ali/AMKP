import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import type { SweepOrphanObjectsUseCase } from "@amkp/application";
import { PlatformAdminGuard } from "../tenancy/platform-admin.guard";
import { SWEEP_ORPHAN_OBJECTS_UC } from "../tenancy/tenancy.tokens";

@Controller("v1/admin/storage")
@UseGuards(PlatformAdminGuard)
export class StorageAdminController {
  constructor(
    @Optional()
    @Inject(SWEEP_ORPHAN_OBJECTS_UC)
    private readonly sweep: SweepOrphanObjectsUseCase | null,
  ) {}

  @Post("sweep-orphans")
  @HttpCode(HttpStatus.OK)
  async sweepOrphans(
    @Body() body: { dryRun?: boolean; prefix?: string },
  ) {
    if (!this.sweep) {
      throw new ServiceUnavailableException({
        error: {
          code: "STORAGE_NOT_CONFIGURED",
          message:
            "Object storage with listKeys is not configured (set AMKP_S3_BUCKET or AMKP_OBJECT_STORAGE_DIR)",
          request_id: "storage_sweep",
        },
      });
    }
    try {
      return await this.sweep.execute({
        dryRun: body.dryRun !== false,
        prefix: body.prefix,
      });
    } catch (err) {
      throw new BadRequestException({
        error: {
          code: "STORAGE_SWEEP_FAILED",
          message: err instanceof Error ? err.message : "sweep failed",
          request_id: "storage_sweep",
        },
      });
    }
  }
}
