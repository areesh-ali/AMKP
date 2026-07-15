import type { EvidenceEnvelope, TenantId } from "@amkp/domain";
import type { RetrieveCachePort } from "@amkp/application";

/**
 * In-process retrieve cache with mandatory tenant_id in the key (T-5.2 / FR-16).
 * Never shares entries across Tenants — even for identical query text.
 * PreferCorrectness entries include threshold so settings edits do not stale-serve.
 */
export class InMemoryTenantRetrieveCache implements RetrieveCachePort {
  private readonly store = new Map<string, EvidenceEnvelope>();

  static key(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
  }): string {
    const thr =
      input.preferCorrectness && input.preferCorrectnessThreshold !== undefined
        ? String(input.preferCorrectnessThreshold)
        : "-";
    return `tenant:${input.tenantId}|pc:${input.preferCorrectness ? "1" : "0"}|thr:${thr}|q:${input.query}`;
  }

  async get(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
  }): Promise<EvidenceEnvelope | null> {
    return this.store.get(InMemoryTenantRetrieveCache.key(input)) ?? null;
  }

  async set(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
    envelope: EvidenceEnvelope;
  }): Promise<void> {
    this.store.set(InMemoryTenantRetrieveCache.key(input), input.envelope);
  }

  clear(): void {
    this.store.clear();
  }

  /** Test helper — count entries for a Tenant. */
  sizeForTenant(tenantId: TenantId): number {
    const prefix = `tenant:${tenantId}|`;
    let n = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) n += 1;
    }
    return n;
  }
}
