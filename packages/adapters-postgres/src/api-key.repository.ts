import type { TenantId } from "@amkp/domain";
import type {
  ApiKeyRecord,
  ApiKeyRepository,
  ResolvedApiKey,
} from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { hashApiKey, toIso } from "./crypto";

export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByPlaintext(
    plaintext: string,
  ): Promise<ResolvedApiKey | null> {
    const keyHash = hashApiKey(plaintext);
    const row = await this.prisma.apiKey.findFirst({
      where: { keyHash, revokedAt: null },
      include: { tenant: true },
    });
    if (!row) return null;
    return {
      apiKeyId: row.id,
      tenantId: row.tenantId,
      accountId: row.tenant.accountId,
      revokedAt: null,
    };
  }

  async findById(apiKeyId: string): Promise<ApiKeyRecord | null> {
    const row = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });
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
