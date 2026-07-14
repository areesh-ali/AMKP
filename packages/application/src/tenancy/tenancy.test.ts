import { describe, expect, it } from "vitest";
import type { Account, AccountId, Tenant, TenantId } from "@amkp/domain";
import {
  AccountNotFoundError,
  CreateAccountUseCase,
  CreateTenantUseCase,
  ListTenantsByAccountUseCase,
  type AccountRepository,
  type ApiKeyIssuer,
  type TenantRepository,
} from "./index";

function createFakes() {
  const accounts = new Map<AccountId, Account>();
  const tenants = new Map<TenantId, Tenant>();
  let seq = 0;

  const accountRepo: AccountRepository = {
    async create({ name }) {
      seq += 1;
      const account: Account = {
        id: `acc_TEST${seq}`,
        name,
        createdAt: new Date().toISOString(),
      };
      accounts.set(account.id, account);
      return account;
    },
    async findById(id) {
      return accounts.get(id) ?? null;
    },
  };

  const tenantRepo: TenantRepository = {
    async create({ accountId, name, agenticEnabled = false }) {
      seq += 1;
      const tenant: Tenant = {
        id: `ten_TEST${seq}`,
        accountId,
        name,
        agenticEnabled,
        createdAt: new Date().toISOString(),
      };
      tenants.set(tenant.id, tenant);
      return tenant;
    },
    async listByAccountId(accountId) {
      return [...tenants.values()].filter((t) => t.accountId === accountId);
    },
  };

  const issued: string[] = [];
  const apiKeys: ApiKeyIssuer = {
    async issueForTenant(tenantId) {
      const plaintext = `amkp_plain_${tenantId}`;
      issued.push(plaintext);
      return { apiKeyId: `key_${tenantId}`, plaintext, tenantId };
    },
  };

  return { accountRepo, tenantRepo, apiKeys, issued, accounts, tenants };
}

describe("CreateAccountUseCase", () => {
  it("creates an account with trimmed name", async () => {
    const { accountRepo } = createFakes();
    const uc = new CreateAccountUseCase(accountRepo);
    const account = await uc.execute({ name: "  Acme  " });
    expect(account.name).toBe("Acme");
    expect(account.id).toMatch(/^acc_/);
  });
});

describe("CreateTenantUseCase", () => {
  it("creates tenant under account, agentic off, returns api key once", async () => {
    const { accountRepo, tenantRepo, apiKeys, issued } = createFakes();
    const account = await accountRepo.create({ name: "Acme" });
    const uc = new CreateTenantUseCase(accountRepo, tenantRepo, apiKeys);
    const result = await uc.execute({ accountId: account.id, name: "support" });

    expect(result.tenant.accountId).toBe(account.id);
    expect(result.tenant.agenticEnabled).toBe(false);
    expect(result.tenant.id).toMatch(/^ten_/);
    expect(result.apiKey).toBe(`amkp_plain_${result.tenant.id}`);
    expect(issued).toHaveLength(1);
  });

  it("throws AccountNotFoundError when account missing", async () => {
    const { accountRepo, tenantRepo, apiKeys } = createFakes();
    const uc = new CreateTenantUseCase(accountRepo, tenantRepo, apiKeys);
    await expect(
      uc.execute({ accountId: "acc_missing", name: "support" }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});

describe("ListTenantsByAccountUseCase", () => {
  it("lists only tenants for the requested account", async () => {
    const { accountRepo, tenantRepo, apiKeys } = createFakes();
    const a = await accountRepo.create({ name: "A" });
    const b = await accountRepo.create({ name: "B" });
    const createTenant = new CreateTenantUseCase(accountRepo, tenantRepo, apiKeys);
    await createTenant.execute({ accountId: a.id, name: "support" });
    await createTenant.execute({ accountId: b.id, name: "docs" });

    const list = new ListTenantsByAccountUseCase(accountRepo, tenantRepo);
    const items = await list.execute(a.id);
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("support");
    expect(items.every((t) => t.accountId === a.id)).toBe(true);
  });

  it("throws when account does not exist", async () => {
    const { accountRepo, tenantRepo } = createFakes();
    const list = new ListTenantsByAccountUseCase(accountRepo, tenantRepo);
    await expect(list.execute("acc_nope")).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
  });
});
