import type { EvidenceEnvelope } from "@amkp/domain";
import type { TenantContext } from "./tenancy/types";
import type { RetrieveQuery } from "./retrieve";

export type { AccountId, Account, Tenant } from "@amkp/domain";
export type { TenantContext } from "./tenancy/types";
export type { TenantId } from "@amkp/domain";
export * from "./tenancy";
export * from "./retrieve";
export * from "./ingest";
export * from "./mcp";
export * from "./observability";

export interface RetrievePort {
  retrieve(ctx: TenantContext, input: RetrieveQuery): Promise<EvidenceEnvelope>;
}

export interface HealthPort {
  check(): Promise<{ ok: boolean; service: string }>;
}

export class HealthUseCase {
  constructor(private readonly health: HealthPort) {}

  async execute() {
    return this.health.check();
  }
}
