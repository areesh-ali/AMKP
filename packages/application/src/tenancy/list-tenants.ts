import type { AccountId, Tenant } from "@amkp/domain";
import {
  AccountNotFoundError,
  type AccountRepository,
  type TenantRepository,
} from "./ports";

export class ListTenantsByAccountUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(accountId: AccountId): Promise<Tenant[]> {
    const account = await this.accounts.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    return this.tenants.listByAccountId(accountId);
  }
}
