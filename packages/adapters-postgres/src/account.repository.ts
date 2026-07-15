import { ulid } from "ulid";
import type { Account, AccountId } from "@amkp/domain";
import type { AccountRepository } from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { toIso } from "./crypto";

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { name: string }): Promise<Account> {
    const row = await this.prisma.account.create({
      data: {
        id: `acc_${ulid()}`,
        name: input.name,
      },
    });
    return {
      id: row.id,
      name: row.name,
      createdAt: toIso(row.createdAt),
    };
  }

  async findById(accountId: AccountId): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      createdAt: toIso(row.createdAt),
    };
  }
}
