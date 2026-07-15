import { ulid } from "ulid";
import type { AccountId, Tenant, TenantId } from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import type { TenantRepository } from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { toIso } from "./crypto";

export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    accountId: AccountId;
    name: string;
    agenticEnabled?: boolean;
  }): Promise<Tenant> {
    const id = `ten_${ulid()}`;
    const row = await this.prisma.tenant.create({
      data: {
        id,
        accountId: input.accountId,
        name: input.name,
        agenticEnabled: input.agenticEnabled ?? false,
        vectorNamespace: tenantVectorNamespace(id),
      },
    });
    return mapTenant(row);
  }

  async listByAccountId(accountId: AccountId): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapTenant);
  }

  async findById(tenantId: TenantId): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!row) return null;
    return mapTenant(row);
  }
}

function mapTenant(row: {
  id: string;
  accountId: string;
  name: string;
  agenticEnabled: boolean;
  vectorNamespace: string;
  createdAt: Date;
}): Tenant {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    agenticEnabled: row.agenticEnabled,
    vectorNamespace: row.vectorNamespace,
    createdAt: toIso(row.createdAt),
  };
}
