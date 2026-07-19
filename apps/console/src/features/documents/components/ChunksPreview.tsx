import type { ChunkRow } from "../lib/types";

function preview(content?: string, max = 220): string {
  if (!content) return "—";
  const t = content.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function ChunksPreview({ chunks }: { chunks: ChunkRow[] }) {
  if (chunks.length === 0) {
    return (
      <p className="text-sm text-muted">
        No chunks yet — wait for parse to finish before Retrieve.
      </p>
    );
  }

  const sorted = [...chunks].sort(
    (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0),
  );

  return (
    <ul className="space-y-2">
      {sorted.map((c) => (
        <li
          key={c.chunkId}
          className="rounded-xl border border-line bg-elevated px-4 py-3"
        >
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
            <span className="font-mono">
              #{c.ordinal ?? "—"}
            </span>
            {c.parseTier != null ? (
              <span>tier {String(c.parseTier)}</span>
            ) : null}
            {c.parseConfidence != null ? (
              <span>conf {c.parseConfidence.toFixed(2)}</span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-ink">{preview(c.content)}</p>
        </li>
      ))}
    </ul>
  );
}
