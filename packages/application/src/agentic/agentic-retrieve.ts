import type { EvidenceItem } from "@amkp/domain";
import {
  DEFAULT_AGENTIC_MAX_COST_USD,
  DEFAULT_AGENTIC_MAX_HOPS,
} from "@amkp/domain";
import {
  buildRetrieveCostEstimate,
  RETRIEVE_SEARCH_BASE_USD,
} from "../retrieve/cost-estimate";
import type { IndexedChunk, VectorIndexPort } from "../retrieve/retrieve";

export type TerminationReason = "completed" | "hop_budget" | "cost_budget";

export interface AgenticHopResult {
  items: EvidenceItem[];
  hops: number;
  terminationReason: TerminationReason;
  costEstimate: ReturnType<typeof buildRetrieveCostEstimate>;
}

/**
 * Guarded agentic retrieve loop with hop + cost circuit breakers (FR-14 / T-4.3).
 * Each hop re-queries with prior evidence snippets as context (MVP reformulation).
 */
export async function runAgenticRetrieve(input: {
  index: VectorIndexPort;
  namespace: string;
  tenantId: string;
  query: string;
  maxHops?: number;
  maxCostUsd?: number;
  preferLatestVersions: (hits: IndexedChunk[]) => IndexedChunk[];
  preferLatest: boolean;
}): Promise<AgenticHopResult> {
  const maxHops = Math.max(1, input.maxHops ?? DEFAULT_AGENTIC_MAX_HOPS);
  const maxCost = Math.max(0, input.maxCostUsd ?? DEFAULT_AGENTIC_MAX_COST_USD);

  const byId = new Map<string, EvidenceItem>();
  let hops = 0;
  let spent = 0;
  let terminationReason: TerminationReason = "completed";
  let currentQuery = input.query;

  while (hops < maxHops) {
    const hopCost = buildRetrieveCostEstimate({
      source: "live",
      query: currentQuery,
      hitCount: 1,
    }).estimatedUsd;
    if (spent + hopCost > maxCost && hops > 0) {
      terminationReason = "cost_budget";
      break;
    }
    if (spent + hopCost > maxCost && hops === 0) {
      // Always allow the first hop; break after if over budget.
    }

    hops += 1;
    spent += hopCost;

    const hits = await input.index.search({
      namespace: input.namespace,
      query: currentQuery,
      limit: input.preferLatest ? 40 : 10,
    });
    const safe = hits.filter(
      (h) => h.namespace === input.namespace && h.tenantId === input.tenantId,
    );
    const preferred = input.preferLatest
      ? input.preferLatestVersions(safe)
      : safe;
    const reranked = [...preferred]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);

    for (const h of reranked) {
      if (byId.has(h.id)) continue;
      byId.set(h.id, {
        id: h.id,
        score: h.score ?? 1,
        citation: { documentId: h.documentId },
        content: h.content,
      });
    }

    if (spent > maxCost) {
      terminationReason = "cost_budget";
      break;
    }

    if (hops >= maxHops) {
      terminationReason = "hop_budget";
      break;
    }

    // MVP reformulation: append top snippet keywords for the next hop.
    const top = reranked[0]?.content?.slice(0, 80) ?? "";
    if (!top) {
      terminationReason = "completed";
      break;
    }
    currentQuery = `${input.query} ${top}`;
  }

  if (hops >= maxHops && terminationReason === "completed") {
    terminationReason = "hop_budget";
  }

  const items = [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    items,
    hops,
    terminationReason,
    costEstimate: {
      currency: "USD",
      estimatedUsd: Math.round(spent * 1e8) / 1e8,
      actualUsd: Math.round(spent * 1e8) / 1e8,
    },
  };
}

/** Tiny helper so tests can force cost breaks without huge queries. */
export function agenticHopBaseCost(): number {
  return RETRIEVE_SEARCH_BASE_USD;
}
