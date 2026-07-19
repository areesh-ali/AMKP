import type { EvidenceEnvelope, EvidenceItem } from "@amkp/sdk-js";
import { Link } from "react-router-dom";
import { Badge, CostChip } from "../../../shared/ui";

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const citation = item.citation;
  return (
    <article className="rounded-xl border border-line bg-elevated px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
        <span className="font-mono text-teal">score {item.score.toFixed(3)}</span>
        {item.parseTier != null ? <span>tier {item.parseTier}</span> : null}
        {citation.page != null ? <span>p.{citation.page}</span> : null}
        {citation.location ? <span>{citation.location}</span> : null}
      </div>
      {item.content ? (
        <p className="mb-3 text-sm leading-relaxed text-ink whitespace-pre-wrap">
          {item.content}
        </p>
      ) : (
        <p className="mb-3 text-sm text-muted">No content preview</p>
      )}
      <Link
        to={`/documents/${encodeURIComponent(citation.documentId)}`}
        className="font-mono text-[12px] text-teal hover:underline"
      >
        {citation.documentId}
      </Link>
    </article>
  );
}

export function EvidencePanel({ envelope }: { envelope: EvidenceEnvelope }) {
  const { outcome, routerDecision, requestId } = envelope;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Evidence</h2>
        <CostChip cost={envelope.costEstimate} />
        {routerDecision ? (
          <Badge tone="muted">
            {`${routerDecision.mode}${routerDecision.hops != null ? ` · ${routerDecision.hops} hops` : ""}`}
          </Badge>
        ) : null}
        <Link
          to={`/traces?requestId=${encodeURIComponent(requestId)}`}
          className="ml-auto text-[12px] font-medium text-muted hover:text-ink"
        >
          Trace {requestId.slice(0, 8)}…
        </Link>
      </div>

      {outcome.kind === "insufficient_evidence" ? (
        <div className="rounded-xl border border-line bg-working-soft px-4 py-4 text-sm text-working">
          <p className="font-medium">Insufficient evidence</p>
          <p className="mt-1 opacity-90">{outcome.reason}</p>
          <p className="mt-2 font-mono text-[12px]">
            threshold {outcome.threshold}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {outcome.items.map((item) => (
            <li key={item.id}>
              <EvidenceCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
