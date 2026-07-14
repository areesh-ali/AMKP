import type { Account, AccountId, Tenant, TenantId } from "@amkp/domain";

export interface AccountRepository {
  create(input: { name: string }): Promise<Account>;
  findById(accountId: AccountId): Promise<Account | null>;
}

export interface TenantRepository {
  create(input: {
    accountId: AccountId;
    name: string;
    agenticEnabled?: boolean;
  }): Promise<Tenant>;
  listByAccountId(accountId: AccountId): Promise<Tenant[]>;
}

export interface IssuedApiKey {
  apiKeyId: string;
  plaintext: string;
  tenantId: TenantId;
}

export interface ApiKeyIssuer {
  /** Persist hash only; return plaintext once. */
  issueForTenant(tenantId: TenantId): Promise<IssuedApiKey>;
}

export class AccountNotFoundError extends Error {
  readonly code = "ACCOUNT_NOT_FOUND";

  constructor(accountId: AccountId) {
    super(`Account not found: ${accountId}`);
    this.name = "AccountNotFoundError";
  }
}
