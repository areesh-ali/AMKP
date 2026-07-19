import type { CostEstimate } from "@amkp/sdk-js";

function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}

export function CostChip({ cost }: { cost: CostEstimate }) {
  const shown =
    cost.actualUsd !== undefined ? cost.actualUsd : cost.estimatedUsd;
  const label = cost.actualUsd !== undefined ? "actual" : "est.";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-cost-soft px-2.5 py-1 text-[12px] font-medium text-cost">
      <span className="uppercase tracking-wide opacity-80">{label}</span>
      <span className="font-mono">
        {usd(shown)} {cost.currency}
      </span>
    </span>
  );
}
