import type { EvidenceEnvelope, TenantId } from "@amkp/domain";
import type { TenantContext } from "./tenancy/types";

export type { AccountId, Account, Tenant } from "@amkp/domain";
export type { TenantContext } from "./tenancy/types";
export * from "./tenancy";

export interface RetrieveQuery {
  query: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
}

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

// keep TenantId import used for RetrievePort consumers via domain re-exports
export type { TenantId };
