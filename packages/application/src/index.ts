import type { EvidenceEnvelope, TenantId } from "@amkp/domain";

export type { AccountId, Account, Tenant } from "@amkp/domain";
export * from "./tenancy";

/** Resolved only from auth middleware — never from client body (AD-2). */
export interface TenantContext {
  tenantId: TenantId;
  accountId: string;
}

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
