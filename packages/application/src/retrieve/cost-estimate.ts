import type { CostEstimate } from "@amkp/domain";

/** Stub USD per 1k query chars for synchronous embedding/search (AD-7 / T-3.4). */
export const RETRIEVE_EMBED_USD_PER_1K_CHARS = 0.00002;
/** Fixed hybrid search/rerank overhead per request when index is queried. */
export const RETRIEVE_SEARCH_BASE_USD = 0.000001;

export type CostEstimateSource = "live" | "cache_hit";

/**
 * Build CostEstimate for a Retrieve response (FR-11 / T-3.4).
 * Cache hits return estimatedUsd 0; live path uses stub embedding + search rates.
 */
export function buildRetrieveCostEstimate(input: {
  source: CostEstimateSource;
  query: string;
  hitCount?: number;
}): CostEstimate {
  if (input.source === "cache_hit") {
    return { currency: "USD", estimatedUsd: 0, actualUsd: 0 };
  }

  const chars = Math.max(0, input.query.length);
  const embed = (chars / 1000) * RETRIEVE_EMBED_USD_PER_1K_CHARS;
  const search = RETRIEVE_SEARCH_BASE_USD;
  // Tiny per-hit accounting so empty vs non-empty are distinguishable in tests.
  const hits = Math.max(0, input.hitCount ?? 0) * 0.0000001;
  const estimatedUsd = roundUsd(embed + search + hits);

  return {
    currency: "USD",
    estimatedUsd,
    // MVP: actual equals estimate until real provider metering lands.
    actualUsd: estimatedUsd,
  };
}

function roundUsd(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
