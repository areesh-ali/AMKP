import type { TraceRecord } from "@amkp/sdk-js";
import { Badge, CostChip } from "../../../shared/ui";
import { HopSteps } from "./HopSteps";

export function TraceDetail({ trace }: { trace: TraceRecord }) {
  const { routerDecision } = trace;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={trace.outcomeKind === "evidence" ? "ok" : "warn"}>
          {trace.outcomeKind}
        </Badge>
        <Badge tone="muted">
          {`${routerDecision.mode}${routerDecision.hops != null ? ` · ${routerDecision.hops} hops` : ""}`}
        </Badge>
        <CostChip cost={trace.costEstimate} />
      </div>

      <dl className="grid gap-2 rounded-xl border border-line bg-elevated p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">requestId</dt>
          <dd className="font-mono text-[12px] break-all">{trace.requestId}</dd>
        </div>
        <div>
          <dt className="text-muted">tenantId</dt>
          <dd className="font-mono text-[12px] break-all">{trace.tenantId}</dd>
        </div>
        <div>
          <dt className="text-muted">Created</dt>
          <dd>{new Date(trace.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted">Router reason</dt>
          <dd className="font-mono text-[12px]">{routerDecision.reasonCode}</dd>
        </div>
        {routerDecision.terminationReason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted">Termination</dt>
            <dd>{routerDecision.terminationReason}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-muted">Evidence IDs</dt>
          <dd className="font-mono text-[12px] break-all">
            {trace.evidenceIds.length > 0
              ? trace.evidenceIds.join(", ")
              : "—"}
          </dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Agent hops
        </h2>
        <HopSteps steps={trace.steps} />
      </section>
    </div>
  );
}
