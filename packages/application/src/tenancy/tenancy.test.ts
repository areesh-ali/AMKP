import { describe, expect, it } from "vitest";
import type { Account, AccountId, Tenant, TenantId } from "@amkp/domain";
import {
  AccountNotFoundError,
  ApiKeyRevokedError,
  CreateAccountUseCase,
  CreateApiKeyUseCase,
  CreateTenantUseCase,
  ListTenantsByAccountUseCase,
  ResolveTenantContextUseCase,
  RevokeApiKeyUseCase,
  RotateApiKeyUseCase,
  type AccountRepository,
  type ApiKeyIssuer,
  type ApiKeyRepository,
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
        vectorNamespace: `ns_ten_TEST${seq}`,
        createdAt: new Date().toISOString(),
      };
      tenants.set(tenant.id, tenant);
      return tenant;
    },
    async listByAccountId(accountId) {
      return [...tenants.values()].filter((t) => t.accountId === accountId);
    },
    async findById(id) {
      return tenants.get(id) ?? null;
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

function createApiKeyFakes(tenants: Map<TenantId, Tenant>) {
  const records = new Map<
    string,
    {
      id: string;
      tenantId: string;
      prefix: string;
      createdAt: string;
      revokedAt: string | null;
      plaintext: string;
    }
  >();
  let keySeq = 0;

  const issuer: ApiKeyIssuer = {
    async issueForTenant(tenantId) {
      keySeq += 1;
      const id = `key_NEW${keySeq}`;
      const plaintext = `amkp_${id}`;
      records.set(id, {
        id,
        tenantId,
        prefix: plaintext.slice(0, 8),
        createdAt: new Date().toISOString(),
        revokedAt: null,
        plaintext,
      });
      return { apiKeyId: id, plaintext, tenantId };
    },
  };

  const repo: ApiKeyRepository = {
    async findActiveByPlaintext(plaintext) {
      const hit = [...records.values()].find((r) => r.plaintext === plaintext);
      if (!hit) return null;
      const t = tenants.get(hit.tenantId);
      if (!t) return null;
      return {
        apiKeyId: hit.id,
        tenantId: hit.tenantId,
        accountId: t.accountId,
        revokedAt: hit.revokedAt,
      };
    },
    async findById(id) {
      const hit = records.get(id);
      if (!hit) return null;
      return {
        id: hit.id,
        tenantId: hit.tenantId,
        prefix: hit.prefix,
        createdAt: hit.createdAt,
        revokedAt: hit.revokedAt,
      };
    },
    async listByTenantId(tenantId) {
      return [...records.values()]
        .filter((r) => r.tenantId === tenantId)
        .map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          prefix: r.prefix,
          createdAt: r.createdAt,
          revokedAt: r.revokedAt,
        }));
    },
    async revoke(id) {
      const hit = records.get(id)!;
      hit.revokedAt = new Date().toISOString();
      return {
        id: hit.id,
        tenantId: hit.tenantId,
        prefix: hit.prefix,
        createdAt: hit.createdAt,
        revokedAt: hit.revokedAt,
      };
    },
  };

  return { issuer, repo };
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

describe("API key lifecycle", () => {
  it("creates, resolves, revokes, and rotates", async () => {
    const { accountRepo, tenantRepo, apiKeys, tenants } = createFakes();
    const account = await accountRepo.create({ name: "Acme" });
    const createTenant = new CreateTenantUseCase(accountRepo, tenantRepo, apiKeys);
    const { tenant } = await createTenant.execute({
      accountId: account.id,
      name: "support",
    });

    const { issuer, repo } = createApiKeyFakes(tenants);
    const createKey = new CreateApiKeyUseCase(tenantRepo, issuer);
    const issued = await createKey.execute(tenant.id);

    const resolve = new ResolveTenantContextUseCase(repo);
    const ctx = await resolve.execute(issued.plaintext);
    expect(ctx.tenantId).toBe(tenant.id);
    expect(ctx.accountId).toBe(account.id);

    const revoke = new RevokeApiKeyUseCase(tenantRepo, repo);
    await revoke.execute({ tenantId: tenant.id, apiKeyId: issued.apiKeyId });
    await expect(resolve.execute(issued.plaintext)).rejects.toBeInstanceOf(
      ApiKeyRevokedError,
    );

    const again = await createKey.execute(tenant.id);
    const rotate = new RotateApiKeyUseCase(tenantRepo, repo, issuer);
    const rotated = await rotate.execute({
      tenantId: tenant.id,
      apiKeyId: again.apiKeyId,
    });
    expect(rotated.revokedApiKeyId).toBe(again.apiKeyId);
    await expect(resolve.execute(again.plaintext)).rejects.toBeInstanceOf(
      ApiKeyRevokedError,
    );
    const ctx2 = await resolve.execute(rotated.issued.plaintext);
    expect(ctx2.tenantId).toBe(tenant.id);
  });
});
