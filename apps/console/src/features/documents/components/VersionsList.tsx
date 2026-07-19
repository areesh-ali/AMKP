import { Link } from "react-router-dom";
import { Badge } from "../../../shared/ui";
import { statusTone, type VersionRow } from "../lib/types";

export function VersionsList({
  versions,
  activeId,
}: {
  versions: VersionRow[];
  activeId: string;
}) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted">No other versions for this sourceKey.</p>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-elevated">
      {versions.map((v) => {
        const active = v.documentId === activeId;
        return (
          <li key={v.documentId} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">
                  v{v.version ?? "—"}
                </span>
                <Badge tone={statusTone(v.status)}>
                  {v.status ?? "unknown"}
                </Badge>
                {active ? (
                  <span className="text-[11px] font-medium text-teal">
                    viewing
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
                {v.documentId}
              </div>
            </div>
            {!active ? (
              <Link
                to={`/documents/${encodeURIComponent(v.documentId)}`}
                className="shrink-0 text-sm font-medium text-teal hover:underline"
              >
                Open
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
