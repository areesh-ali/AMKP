import type { TenantId } from "@amkp/domain";
import {
  TenantNotFoundError,
  type ApiKeyIssuer,
  type IssuedApiKey,
  type TenantRepository,
} from "./ports";

export class CreateApiKeyUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly apiKeys: ApiKeyIssuer,
  ) {}

  async execute(tenantId: TenantId): Promise<IssuedApiKey> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }
    return this.apiKeys.issueForTenant(tenantId);
  }
}
