import { createHash, randomBytes } from "node:crypto";
import { ulid } from "ulid";
import type { Account, AccountId, Tenant, TenantId } from "@amkp/domain";
import type {
  AccountRepository,
  ApiKeyIssuer,
  ApiKeyRecord,
  ApiKeyRepository,
  IssuedApiKey,
  ResolvedApiKey,
  TenantRepository,
} from "@amkp/application";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

function toIso(d: Date): string {
  return d.toISOString();
}

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

export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    accountId: AccountId;
    name: string;
    agenticEnabled?: boolean;
  }): Promise<Tenant> {
    const row = await this.prisma.tenant.create({
      data: {
        id: `ten_${ulid()}`,
        accountId: input.accountId,
        name: input.name,
        agenticEnabled: input.agenticEnabled ?? false,
      },
    });
    return {
      id: row.id,
      accountId: row.accountId,
      name: row.name,
      agenticEnabled: row.agenticEnabled,
      createdAt: toIso(row.createdAt),
    };
  }

  async listByAccountId(accountId: AccountId): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      accountId: row.accountId,
      name: row.name,
      agenticEnabled: row.agenticEnabled,
      createdAt: toIso(row.createdAt),
    }));
  }

  async findById(tenantId: TenantId): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!row) return null;
    return {
      id: row.id,
      accountId: row.accountId,
      name: row.name,
      agenticEnabled: row.agenticEnabled,
      createdAt: toIso(row.createdAt),
    };
  }
}

export class PrismaApiKeyIssuer implements ApiKeyIssuer {
  constructor(private readonly prisma: PrismaClient) {}

  async issueForTenant(tenantId: TenantId): Promise<IssuedApiKey> {
    const plaintext = `amkp_${ulid()}_${randomBytes(16).toString("hex")}`;
    const keyHash = hashApiKey(plaintext);
    const id = `key_${ulid()}`;
    await this.prisma.apiKey.create({
      data: {
        id,
        tenantId,
        keyHash,
        prefix: plaintext.slice(0, 12),
      },
    });
    return { apiKeyId: id, plaintext, tenantId };
  }
}

export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByPlaintext(
    plaintext: string,
  ): Promise<ResolvedApiKey | null> {
    const keyHash = hashApiKey(plaintext);
    const row = await this.prisma.apiKey.findFirst({
      where: { keyHash },
      include: { tenant: true },
    });
    if (!row) return null;
    return {
      apiKeyId: row.id,
      tenantId: row.tenantId,
      accountId: row.tenant.accountId,
      revokedAt: row.revokedAt ? toIso(row.revokedAt) : null,
    };
  }

  async findById(apiKeyId: string): Promise<ApiKeyRecord | null> {
    const row = await this.prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenantId,
      prefix: row.prefix,
      createdAt: toIso(row.createdAt),
      revokedAt: row.revokedAt ? toIso(row.revokedAt) : null,
    };
  }

  async listByTenantId(tenantId: TenantId): Promise<ApiKeyRecord[]> {
    const rows = await this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      prefix: row.prefix,
      createdAt: toIso(row.createdAt),
      revokedAt: row.revokedAt ? toIso(row.revokedAt) : null,
    }));
  }

  async revoke(apiKeyId: string): Promise<ApiKeyRecord> {
    const row = await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { revokedAt: new Date() },
    });
    return {
      id: row.id,
      tenantId: row.tenantId,
      prefix: row.prefix,
      createdAt: toIso(row.createdAt),
      revokedAt: row.revokedAt ? toIso(row.revokedAt) : null,
    };
  }
}

export { PrismaClient };
