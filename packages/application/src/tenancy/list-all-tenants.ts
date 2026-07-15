import type { AccountId, Tenant } from "@amkp/domain";
import type { TenantRepository } from "./ports";

export class ListTenantsUseCase {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(opts?: {
    accountId?: AccountId;
    limit?: number;
  }): Promise<Tenant[]> {
    const limit = Math.min(Math.max(Math.floor(opts?.limit ?? 100) || 100, 1), 500);
    return this.tenants.list({
      accountId: opts?.accountId,
      limit,
    });
  }
}
