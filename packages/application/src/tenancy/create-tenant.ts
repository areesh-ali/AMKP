import type { AccountId, Tenant } from "@amkp/domain";
import {
  AccountNotFoundError,
  type AccountRepository,
  type ApiKeyIssuer,
  type TenantRepository,
} from "./ports";

export interface CreateTenantResult {
  tenant: Tenant;
  apiKey: string;
}

export class CreateTenantUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly tenants: TenantRepository,
    private readonly apiKeys: ApiKeyIssuer,
  ) {}

  async execute(input: {
    accountId: AccountId;
    name: string;
  }): Promise<CreateTenantResult> {
    const name = input.name?.trim();
    if (!name) {
      throw new Error("Tenant name is required");
    }

    const account = await this.accounts.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    const tenant = await this.tenants.create({
      accountId: input.accountId,
      name,
      agenticEnabled: false,
    });

    const issued = await this.apiKeys.issueForTenant(tenant.id);
    return { tenant, apiKey: issued.plaintext };
  }
}
