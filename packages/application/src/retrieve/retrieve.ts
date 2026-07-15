import type {
  EvidenceEnvelope,
  EvidenceItem,
  TableEvidence,
  TenantId,
} from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";

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

export class RetrieveUseCase {
  constructor(private readonly index: VectorIndexPort) {}

  /**
   * Fail-closed retrieve (AD-3 / FR-16).
   * Prefers latest Document version per sourceKey by default (FR-7 / T-2.5).
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

    // Hybrid rerank (T-3.1): sort by score desc, then take top-k.
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

    const emptyOutcome =
      input.preferCorrectness === true
        ? {
            kind: "insufficient_evidence" as const,
            reason: "no_matches",
            threshold: 0,
          }
        : { kind: "evidence" as const, items: [] };

    return {
      schemaVersion: "1",
      requestId: options.requestId,
      tenantId: ctx.tenantId,
      outcome:
        items.length > 0 ? { kind: "evidence", items } : emptyOutcome,
      costEstimate: { currency: "USD", estimatedUsd: 0 },
      routerDecision: { mode: "single_pass", reasonCode: "default" },
    };
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
