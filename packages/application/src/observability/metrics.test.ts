import { describe, expect, it } from "vitest";
import { InMemoryMetrics } from "./metrics";

describe("InMemoryMetrics (T-6.2)", () => {
  it("renders Prometheus text with tenant_id labels", () => {
    const m = new InMemoryMetrics();
    m.observeRetrieve({
      tenantId: "ten_A",
      latencyMs: 12.5,
      ok: true,
      agenticHops: 2,
      costUsd: 0.001,
    });
    m.observeRetrieve({
      tenantId: "ten_A",
      latencyMs: 5,
      ok: false,
      agenticHops: 0,
      costUsd: 0,
    });
    const text = m.renderPrometheus();
    expect(text).toContain('amkp_retrieve_requests_total{tenant_id="ten_A"} 2');
    expect(text).toContain('amkp_retrieve_errors_total{tenant_id="ten_A"} 1');
    expect(text).toContain('amkp_agentic_hops_total{tenant_id="ten_A"} 2');
    expect(text).toContain('amkp_retrieve_cost_usd_total{tenant_id="ten_A"} 0.001');
    expect(text).toContain("amkp_retrieve_latency_ms_sum");
  });
});
