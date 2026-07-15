import type { Tenant } from "@amkp/domain";
import type { TenantRepository } from "./ports";
import { TenantNotFoundError, ValidationError } from "./ports";

export class GetTenantUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(tenantId: string): Promise<Tenant> {
    const id = tenantId?.trim();
    if (!id) {
      throw new ValidationError("tenantId is required");
    }
    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      throw new TenantNotFoundError(id);
    }
    return tenant;
  }
}
