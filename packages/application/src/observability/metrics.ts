/**
 * Lightweight Prometheus text exposition (FR-20 / T-6.2).
 * No external prom client required for MVP.
 */

export interface MetricsPort {
  observeRetrieve(input: {
    tenantId: string;
    latencyMs: number;
    ok: boolean;
    agenticHops: number;
    costUsd: number;
  }): void;
  renderPrometheus(): string;
}

export const METRICS = Symbol("METRICS");

type Labeled = { tenantId: string };

export class InMemoryMetrics implements MetricsPort {
  private readonly retrieveCount = new Map<string, number>();
  private readonly retrieveErrors = new Map<string, number>();
  private readonly retrieveLatencySum = new Map<string, number>();
  private readonly retrieveLatencyCount = new Map<string, number>();
  private readonly agenticHops = new Map<string, number>();
  private readonly costUsd = new Map<string, number>();

  observeRetrieve(input: {
    tenantId: string;
    latencyMs: number;
    ok: boolean;
    agenticHops: number;
    costUsd: number;
  }): void {
    const t = input.tenantId;
    this.retrieveCount.set(t, (this.retrieveCount.get(t) ?? 0) + 1);
    if (!input.ok) {
      this.retrieveErrors.set(t, (this.retrieveErrors.get(t) ?? 0) + 1);
    }
    this.retrieveLatencySum.set(
      t,
      (this.retrieveLatencySum.get(t) ?? 0) + input.latencyMs,
    );
    this.retrieveLatencyCount.set(
      t,
      (this.retrieveLatencyCount.get(t) ?? 0) + 1,
    );
    if (input.agenticHops > 0) {
      this.agenticHops.set(t, (this.agenticHops.get(t) ?? 0) + input.agenticHops);
    }
    this.costUsd.set(t, (this.costUsd.get(t) ?? 0) + input.costUsd);
  }

  renderPrometheus(): string {
    const lines: string[] = [];
    lines.push("# HELP amkp_retrieve_requests_total Total Retrieve requests");
    lines.push("# TYPE amkp_retrieve_requests_total counter");
    for (const [tenant, v] of this.retrieveCount) {
      lines.push(
        `amkp_retrieve_requests_total{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    lines.push("# HELP amkp_retrieve_errors_total Total Retrieve errors");
    lines.push("# TYPE amkp_retrieve_errors_total counter");
    for (const [tenant, v] of this.retrieveErrors) {
      lines.push(
        `amkp_retrieve_errors_total{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    lines.push(
      "# HELP amkp_retrieve_latency_ms_sum Sum of Retrieve latency in milliseconds",
    );
    lines.push("# TYPE amkp_retrieve_latency_ms_sum counter");
    for (const [tenant, v] of this.retrieveLatencySum) {
      lines.push(
        `amkp_retrieve_latency_ms_sum{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    lines.push(
      "# HELP amkp_retrieve_latency_ms_count Count of Retrieve latency samples",
    );
    lines.push("# TYPE amkp_retrieve_latency_ms_count counter");
    for (const [tenant, v] of this.retrieveLatencyCount) {
      lines.push(
        `amkp_retrieve_latency_ms_count{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    lines.push("# HELP amkp_agentic_hops_total Total agentic hops executed");
    lines.push("# TYPE amkp_agentic_hops_total counter");
    for (const [tenant, v] of this.agenticHops) {
      lines.push(
        `amkp_agentic_hops_total{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    lines.push(
      "# HELP amkp_retrieve_cost_usd_total Accumulated CostEstimate USD",
    );
    lines.push("# TYPE amkp_retrieve_cost_usd_total counter");
    for (const [tenant, v] of this.costUsd) {
      lines.push(
        `amkp_retrieve_cost_usd_total{tenant_id="${escapeLabel(tenant)}"} ${v}`,
      );
    }

    return `${lines.join("\n")}\n`;
  }

  clear(): void {
    this.retrieveCount.clear();
    this.retrieveErrors.clear();
    this.retrieveLatencySum.clear();
    this.retrieveLatencyCount.clear();
    this.agenticHops.clear();
    this.costUsd.clear();
  }
}

function escapeLabel(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export type { Labeled };
