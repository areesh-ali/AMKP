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
  }): Promise<Tenant> {
    if (
      input.pageVisionEnabled === undefined &&
      input.agenticEnabled === undefined
    ) {
      throw new ValidationError(
        "At least one of pageVisionEnabled or agenticEnabled is required",
      );
    }

    const existing = await this.tenants.findById(input.tenantId);
    if (!existing) {
      throw new TenantNotFoundError(input.tenantId);
    }

    return this.tenants.updateSettings(input.tenantId, {
      pageVisionEnabled: input.pageVisionEnabled,
      agenticEnabled: input.agenticEnabled,
    });
  }
}
