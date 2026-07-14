import type { Account } from "@amkp/domain";
import type { AccountRepository } from "./ports";

export class CreateAccountUseCase {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(input: { name: string }): Promise<Account> {
    const name = input.name?.trim();
    if (!name) {
      throw new Error("Account name is required");
    }
    return this.accounts.create({ name });
  }
}
