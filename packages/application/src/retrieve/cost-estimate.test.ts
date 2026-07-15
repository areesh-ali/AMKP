import { describe, expect, it } from "vitest";
import {
  buildRetrieveCostEstimate,
  RETRIEVE_SEARCH_BASE_USD,
} from "./cost-estimate";

describe("buildRetrieveCostEstimate (T-3.4)", () => {
  it("cache hit is always USD 0", () => {
    const c = buildRetrieveCostEstimate({
      source: "cache_hit",
      query: "anything expensive looking",
    });
    expect(c).toEqual({ currency: "USD", estimatedUsd: 0, actualUsd: 0 });
  });

  it("live retrieve is non-negative and scales with query length", () => {
    const short = buildRetrieveCostEstimate({
      source: "live",
      query: "hi",
      hitCount: 0,
    });
    const long = buildRetrieveCostEstimate({
      source: "live",
      query: "x".repeat(5000),
      hitCount: 3,
    });
    expect(short.currency).toBe("USD");
    expect(short.estimatedUsd).toBeGreaterThanOrEqual(RETRIEVE_SEARCH_BASE_USD);
    expect(long.estimatedUsd).toBeGreaterThan(short.estimatedUsd);
    expect(long.actualUsd).toBe(long.estimatedUsd);
  });
});
