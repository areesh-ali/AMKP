import type { Tenant, TenantId } from "@amkp/domain";
import {
  TenantNotFoundError,
  ValidationError,
  type TenantRepository,
} from "./ports";

export class UpdateTenantSettingsUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(input: {
    tenantId: TenantId;
    pageVisionEnabled?: boolean;
    agenticEnabled?: boolean;
    preferCorrectnessThreshold?: number;
  }): Promise<Tenant> {
    if (
      input.pageVisionEnabled === undefined &&
      input.agenticEnabled === undefined &&
      input.preferCorrectnessThreshold === undefined
    ) {
      throw new ValidationError(
        "At least one of pageVisionEnabled, agenticEnabled, or preferCorrectnessThreshold is required",
      );
    }

    if (input.preferCorrectnessThreshold !== undefined) {
      const t = input.preferCorrectnessThreshold;
      if (typeof t !== "number" || Number.isNaN(t) || t < 0 || t > 1) {
        throw new ValidationError(
          "preferCorrectnessThreshold must be a number between 0 and 1",
        );
      }
    }

    const existing = await this.tenants.findById(input.tenantId);
    if (!existing) {
      throw new TenantNotFoundError(input.tenantId);
    }

    return this.tenants.updateSettings(input.tenantId, {
      pageVisionEnabled: input.pageVisionEnabled,
      agenticEnabled: input.agenticEnabled,
      preferCorrectnessThreshold: input.preferCorrectnessThreshold,
    });
  }
}
