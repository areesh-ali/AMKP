import type { TenantId } from "@amkp/domain";
import {
  TenantNotFoundError,
  type ApiKeyRecord,
  type ApiKeyRepository,
  type TenantRepository,
} from "./ports";

export class ListApiKeysUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly apiKeys: ApiKeyRepository,
  ) {}

  async execute(tenantId: TenantId): Promise<ApiKeyRecord[]> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }
    return this.apiKeys.listByTenantId(tenantId);
  }
}
