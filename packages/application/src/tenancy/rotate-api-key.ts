import type { ApiKeyId, TenantId } from "@amkp/domain";
import {
  ApiKeyNotFoundError,
  TenantNotFoundError,
  type ApiKeyIssuer,
  type ApiKeyRepository,
  type IssuedApiKey,
  type TenantRepository,
} from "./ports";

export interface RotateApiKeyResult {
  issued: IssuedApiKey;
  revokedApiKeyId: ApiKeyId;
}

export class RotateApiKeyUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly apiKeys: ApiKeyRepository,
    private readonly issuer: ApiKeyIssuer,
  ) {}

  async execute(input: {
    tenantId: TenantId;
    apiKeyId: ApiKeyId;
  }): Promise<RotateApiKeyResult> {
    const tenant = await this.tenants.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(input.tenantId);
    }

    const existing = await this.apiKeys.findById(input.apiKeyId);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new ApiKeyNotFoundError(input.apiKeyId);
    }

    if (!existing.revokedAt) {
      await this.apiKeys.revoke(input.apiKeyId);
    }

    const issued = await this.issuer.issueForTenant(input.tenantId);
    return { issued, revokedApiKeyId: input.apiKeyId };
  }
}
