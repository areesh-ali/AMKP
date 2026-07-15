import type { Account, AccountId } from "@amkp/domain";
import {
  AccountNotFoundError,
  type AccountRepository,
} from "./ports";

export class GetAccountUseCase {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(accountId: AccountId): Promise<Account> {
    const account = await this.accounts.findById(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    return account;
  }
}
