import { randomBytes } from "node:crypto";
import { ulid } from "ulid";
import type { TenantId } from "@amkp/domain";
import type { ApiKeyIssuer, IssuedApiKey } from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { hashApiKey } from "./crypto";

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
