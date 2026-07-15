import type { ApiKeyId, TenantId } from "@amkp/domain";
import {
  ApiKeyNotFoundError,
  TenantNotFoundError,
  type ApiKeyRecord,
  type ApiKeyRepository,
  type TenantRepository,
} from "./ports";

export class RevokeApiKeyUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly apiKeys: ApiKeyRepository,
  ) {}

  async execute(input: {
    tenantId: TenantId;
    apiKeyId: ApiKeyId;
  }): Promise<ApiKeyRecord> {
    const tenant = await this.tenants.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(input.tenantId);
    }

    const existing = await this.apiKeys.findById(input.apiKeyId);
    if (!existing || existing.tenantId !== input.tenantId) {
      throw new ApiKeyNotFoundError(input.apiKeyId);
    }

    if (existing.revokedAt) {
      return existing;
    }

    return this.apiKeys.revoke(input.apiKeyId);
  }
}
