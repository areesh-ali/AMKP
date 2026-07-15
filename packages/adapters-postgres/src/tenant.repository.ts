import { ulid } from "ulid";
import type { AccountId, Tenant, TenantId } from "@amkp/domain";
import {
  DEFAULT_PREFER_CORRECTNESS_THRESHOLD,
  tenantVectorNamespace,
} from "@amkp/domain";
import { TenantNotFoundError, type TenantRepository } from "@amkp/application";
import type { PrismaClient } from "./prisma";
import { toIso } from "./crypto";

export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    accountId: AccountId;
    name: string;
    agenticEnabled?: boolean;
    pageVisionEnabled?: boolean;
  }): Promise<Tenant> {
    const id = `ten_${ulid()}`;
    const row = await this.prisma.tenant.create({
      data: {
        id,
        accountId: input.accountId,
        name: input.name,
        agenticEnabled: input.agenticEnabled ?? false,
        pageVisionEnabled: input.pageVisionEnabled ?? false,
        preferCorrectnessThreshold: DEFAULT_PREFER_CORRECTNESS_THRESHOLD,
        agenticReadinessPassed: false,
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

  async updateSettings(
    tenantId: TenantId,
    patch: {
      pageVisionEnabled?: boolean;
      agenticEnabled?: boolean;
      preferCorrectnessThreshold?: number;
      agenticReadinessPassed?: boolean;
    },
  ): Promise<Tenant> {
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!existing) {
      throw new TenantNotFoundError(tenantId);
    }
    const row = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(patch.pageVisionEnabled !== undefined
          ? { pageVisionEnabled: patch.pageVisionEnabled }
          : {}),
        ...(patch.agenticEnabled !== undefined
          ? { agenticEnabled: patch.agenticEnabled }
          : {}),
        ...(patch.preferCorrectnessThreshold !== undefined
          ? { preferCorrectnessThreshold: patch.preferCorrectnessThreshold }
          : {}),
        ...(patch.agenticReadinessPassed !== undefined
          ? { agenticReadinessPassed: patch.agenticReadinessPassed }
          : {}),
      },
    });
    return mapTenant(row);
  }
}

function mapTenant(row: {
  id: string;
  accountId: string;
  name: string;
  agenticEnabled: boolean;
  pageVisionEnabled: boolean;
  preferCorrectnessThreshold: number;
  agenticReadinessPassed: boolean;
  vectorNamespace: string;
  createdAt: Date;
}): Tenant {
  return {
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    agenticEnabled: row.agenticEnabled,
    pageVisionEnabled: row.pageVisionEnabled,
    preferCorrectnessThreshold: row.preferCorrectnessThreshold,
    agenticReadinessPassed: row.agenticReadinessPassed,
    vectorNamespace: row.vectorNamespace,
    createdAt: toIso(row.createdAt),
  };
}
