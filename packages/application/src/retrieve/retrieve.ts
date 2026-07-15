import type {
  EvidenceEnvelope,
  EvidenceItem,
  TableEvidence,
  TenantId,
} from "@amkp/domain";
import {
  DEFAULT_PREFER_CORRECTNESS_THRESHOLD,
  tenantVectorNamespace,
} from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import {
  MissingTenantContextError,
  ValidationError,
  type TenantRepository,
} from "../tenancy/ports";
import { buildRetrieveCostEstimate } from "./cost-estimate";
import { evidenceEnvelopeToTrace } from "../observability/get-trace";
import type { TraceRepository } from "../observability/trace-ports";

export interface RetrieveQuery {
  query: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
  /** Prefer latest Document version per sourceKey (FR-7 default true). */
  preferLatestVersion?: boolean;
}

export { MissingTenantContextError };

export interface IndexedChunk {
  id: string;
  tenantId: TenantId;
  namespace: string;
  documentId: string;
  content: string;
  score?: number;
  parseConfidence?: number;
  parseTier?: string;
  table?: TableEvidence;
  documentVersionId?: string;
  sourceKey?: string;
  version?: number;
  contentHash?: string;
}

export interface VectorIndexPort {
  upsert(chunk: IndexedChunk): Promise<void>;
  search(input: {
    namespace: string;
    query: string;
    limit?: number;
  }): Promise<IndexedChunk[]>;
}

export const VECTOR_INDEX = Symbol("VECTOR_INDEX");

/**
 * Optional retrieve response cache (T-5.2). Keys must include tenantId.
 * Cache hits still return CostEstimate with estimatedUsd 0 (FR-11 / T-3.4).
 */
export interface RetrieveCachePort {
  get(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    /** Included when preferCorrectness so threshold edits cannot stale-serve. */
    preferCorrectnessThreshold?: number;
  }): Promise<EvidenceEnvelope | null>;
  set(input: {
    tenantId: TenantId;
    query: string;
    preferCorrectness: boolean;
    preferCorrectnessThreshold?: number;
    envelope: EvidenceEnvelope;
  }): Promise<void>;
}

export const RETRIEVE_CACHE = Symbol("RETRIEVE_CACHE");

export class RetrieveUseCase {
  constructor(
    private readonly index: VectorIndexPort,
    private readonly tenants?: TenantRepository,
    private readonly cache?: RetrieveCachePort,
    private readonly traces?: TraceRepository,
  ) {}

  /**
   * Fail-closed retrieve (AD-3 / FR-16).
   * Prefers latest Document version per sourceKey by default (FR-7 / T-2.5).
   * PreferCorrectness (FR-10 / T-3.3) refuses when top score < Tenant threshold.
   * CostEstimate always present (FR-11 / T-3.4); cache hits are $0.
   */
  async execute(
    ctx: TenantContext | undefined | null,
    input: RetrieveQuery,
    options: { requestId: string },
  ): Promise<EvidenceEnvelope> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }

    const query = input.query?.trim();
    if (!query) {
      throw new ValidationError("query is required");
    }

    const preferCorrectness = input.preferCorrectness === true;
    const threshold = preferCorrectness
      ? await this.resolvePreferCorrectnessThreshold(ctx.tenantId)
      : undefined;

    if (this.cache) {
      const cached = await this.cache.get({
        tenantId: ctx.tenantId,
        query,
        preferCorrectness,
        preferCorrectnessThreshold: threshold,
      });
      if (cached) {
        const envelope: EvidenceEnvelope = {
          ...cached,
          requestId: options.requestId,
          tenantId: ctx.tenantId,
          costEstimate: buildRetrieveCostEstimate({
            source: "cache_hit",
            query,
          }),
        };
        await this.persistTrace(envelope);
        return envelope;
      }
    }

    const preferLatest = input.preferLatestVersion !== false;
    const namespace = tenantVectorNamespace(ctx.tenantId);

    const hits = await this.index.search({
      namespace,
      query,
      limit: preferLatest ? 40 : 10,
    });

    const safe = hits.filter(
      (h) => h.namespace === namespace && h.tenantId === ctx.tenantId,
    );

    const preferred = preferLatest
      ? preferLatestVersions(safe)
      : safe;

    const reranked = [...preferred]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);

    const items: EvidenceItem[] = reranked.map((h) => {
      const item: EvidenceItem = {
        id: h.id,
        score: h.score ?? 1,
        citation: { documentId: h.documentId },
        content: h.content,
      };
      if (h.parseConfidence !== undefined) {
        item.parseConfidence = Math.min(1, Math.max(0, h.parseConfidence));
      }
      if (h.parseTier) item.parseTier = h.parseTier;
      if (h.table) item.table = h.table;
      if (h.documentVersionId) item.documentVersionId = h.documentVersionId;
      return item;
    });

    const costEstimate = buildRetrieveCostEstimate({
      source: "live",
      query,
      hitCount: items.length,
    });

    let envelope: EvidenceEnvelope;

    if (preferCorrectness) {
      const topScore = items[0]?.score ?? 0;
      const thr = threshold ?? DEFAULT_PREFER_CORRECTNESS_THRESHOLD;
      if (items.length === 0 || topScore < thr) {
        envelope = {
          schemaVersion: "1",
          requestId: options.requestId,
          tenantId: ctx.tenantId,
          outcome: {
            kind: "insufficient_evidence",
            reason:
              items.length === 0 ? "no_matches" : "below_threshold",
            threshold: thr,
          },
          costEstimate,
          routerDecision: { mode: "single_pass", reasonCode: "default" },
        };
      } else {
        envelope = {
          schemaVersion: "1",
          requestId: options.requestId,
          tenantId: ctx.tenantId,
          outcome: { kind: "evidence", items },
          costEstimate,
          routerDecision: { mode: "single_pass", reasonCode: "default" },
        };
      }
    } else {
      envelope = {
        schemaVersion: "1",
        requestId: options.requestId,
        tenantId: ctx.tenantId,
        outcome: { kind: "evidence", items },
        costEstimate,
        routerDecision: { mode: "single_pass", reasonCode: "default" },
      };
    }

    if (this.cache) {
      await this.cache.set({
        tenantId: ctx.tenantId,
        query,
        preferCorrectness,
        preferCorrectnessThreshold: threshold,
        envelope,
      });
    }

    await this.persistTrace(envelope);
    return envelope;
  }

  private async persistTrace(envelope: EvidenceEnvelope): Promise<void> {
    if (!this.traces) return;
    await this.traces.save(evidenceEnvelopeToTrace(envelope));
  }

  private async resolvePreferCorrectnessThreshold(
    tenantId: TenantId,
  ): Promise<number> {
    if (!this.tenants) {
      return DEFAULT_PREFER_CORRECTNESS_THRESHOLD;
    }
    const tenant = await this.tenants.findById(tenantId);
    const t = tenant?.preferCorrectnessThreshold;
    if (typeof t === "number" && !Number.isNaN(t)) {
      return t;
    }
    return DEFAULT_PREFER_CORRECTNESS_THRESHOLD;
  }
}

/** Keep highest version per sourceKey; chunks without sourceKey pass through. */
export function preferLatestVersions(hits: IndexedChunk[]): IndexedChunk[] {
  const bestBySource = new Map<string, number>();
  for (const h of hits) {
    if (!h.sourceKey) continue;
    const v = h.version ?? 0;
    const prev = bestBySource.get(h.sourceKey) ?? -1;
    if (v > prev) bestBySource.set(h.sourceKey, v);
  }

  return hits.filter((h) => {
    if (!h.sourceKey || h.version === undefined) return true;
    return h.version === bestBySource.get(h.sourceKey);
  });
}
