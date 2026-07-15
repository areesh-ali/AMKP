import type {
  Account,
  AccountId,
  ApiKeyId,
  Tenant,
  TenantId,
} from "@amkp/domain";

export interface AccountRepository {
  create(input: { name: string }): Promise<Account>;
  findById(accountId: AccountId): Promise<Account | null>;
  list(limit?: number): Promise<Account[]>;
}

export interface TenantRepository {
  create(input: {
    accountId: AccountId;
    name: string;
    agenticEnabled?: boolean;
    pageVisionEnabled?: boolean;
  }): Promise<Tenant>;
  listByAccountId(accountId: AccountId): Promise<Tenant[]>;
  list(opts?: { accountId?: AccountId; limit?: number }): Promise<Tenant[]>;
  findById(tenantId: TenantId): Promise<Tenant | null>;
  updateSettings(
    tenantId: TenantId,
    patch: {
      pageVisionEnabled?: boolean;
      agenticEnabled?: boolean;
      preferCorrectnessThreshold?: number;
      agenticReadinessPassed?: boolean;
    },
  ): Promise<Tenant>;
}

export interface IssuedApiKey {
  apiKeyId: ApiKeyId;
  plaintext: string;
  tenantId: TenantId;
}

export interface ApiKeyIssuer {
  /** Persist hash only; return plaintext once. */
  issueForTenant(tenantId: TenantId): Promise<IssuedApiKey>;
}

export interface ApiKeyRecord {
  id: ApiKeyId;
  tenantId: TenantId;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface ResolvedApiKey {
  apiKeyId: ApiKeyId;
  tenantId: TenantId;
  accountId: AccountId;
  revokedAt: string | null;
}

export interface ApiKeyRepository {
  findActiveByPlaintext(plaintext: string): Promise<ResolvedApiKey | null>;
  findById(apiKeyId: ApiKeyId): Promise<ApiKeyRecord | null>;
  listByTenantId(tenantId: TenantId): Promise<ApiKeyRecord[]>;
  revoke(apiKeyId: ApiKeyId): Promise<ApiKeyRecord>;
}

export class AccountNotFoundError extends Error {
  readonly code = "ACCOUNT_NOT_FOUND";

  constructor(accountId: AccountId) {
    super(`Account not found: ${accountId}`);
    this.name = "AccountNotFoundError";
  }
}

export class TenantNotFoundError extends Error {
  readonly code = "TENANT_NOT_FOUND";

  constructor(tenantId: TenantId) {
    super(`Tenant not found: ${tenantId}`);
    this.name = "TenantNotFoundError";
  }
}

export class ApiKeyNotFoundError extends Error {
  readonly code = "API_KEY_NOT_FOUND";

  constructor(apiKeyId: ApiKeyId) {
    super(`API key not found: ${apiKeyId}`);
    this.name = "ApiKeyNotFoundError";
  }
}

export class ApiKeyRevokedError extends Error {
  readonly code = "API_KEY_REVOKED";

  constructor(apiKeyId?: ApiKeyId) {
    super(apiKeyId ? `API key revoked: ${apiKeyId}` : "API key revoked");
    this.name = "ApiKeyRevokedError";
  }
}

export class ApiKeyInvalidError extends Error {
  readonly code = "API_KEY_INVALID";

  constructor() {
    super("Invalid API key");
    this.name = "ApiKeyInvalidError";
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class MissingTenantContextError extends Error {
  readonly code = "MISSING_TENANT_CONTEXT";

  constructor() {
    super("Operation refused: TenantContext was not resolved from auth");
    this.name = "MissingTenantContextError";
  }
}
