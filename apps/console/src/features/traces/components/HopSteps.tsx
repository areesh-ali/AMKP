import type { TraceHopStep } from "@amkp/sdk-js";
import { CostChip } from "../../../shared/ui";

export function HopSteps({ steps }: { steps: TraceHopStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted">
        No hop steps (single_pass or empty agentic run).
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li
          key={`${s.hop}-${s.tool}-${s.query.slice(0, 24)}`}
          className="rounded-xl border border-line bg-elevated px-4 py-3"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-working-soft px-2 py-0.5 text-[12px] font-medium text-working">
              hop {s.hop}
            </span>
            <span className="font-mono text-[12px] text-ink">{s.tool}</span>
            <CostChip cost={s.costEstimate} />
          </div>
          <p className="text-sm text-ink">{s.query}</p>
          <p className="mt-2 font-mono text-[11px] text-muted">
            evidence:{" "}
            {s.evidenceIds.length > 0 ? s.evidenceIds.join(", ") : "—"}
          </p>
        </li>
      ))}
    </ol>
  );
}
