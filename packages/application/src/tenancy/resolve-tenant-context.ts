import type { TenantContext } from "./types";
import {
  ApiKeyInvalidError,
  ApiKeyRevokedError,
  type ApiKeyRepository,
} from "./ports";

export class ResolveTenantContextUseCase {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  async execute(plaintextApiKey: string): Promise<TenantContext> {
    const resolved = await this.apiKeys.findActiveByPlaintext(plaintextApiKey);
    if (!resolved) {
      throw new ApiKeyInvalidError();
    }
    if (resolved.revokedAt) {
      throw new ApiKeyRevokedError(resolved.apiKeyId);
    }
    return {
      tenantId: resolved.tenantId,
      accountId: resolved.accountId,
    };
  }
}
