import type { Account } from "@amkp/domain";
import type { AccountRepository } from "./ports";

export class ListAccountsUseCase {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(limit = 100): Promise<Account[]> {
    const capped = Math.min(Math.max(Math.floor(limit) || 100, 1), 500);
    return this.accounts.list(capped);
  }
}
