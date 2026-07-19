export function EvalReport({ title, data }: { title: string; data: unknown }) {
  const summary = summarize(data);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
        {title}
      </h2>
      {summary ? (
        <div className="flex flex-wrap gap-3 text-sm">
          {summary.map((s) => (
            <span
              key={s.label}
              className="rounded-full bg-canvas px-3 py-1 font-mono text-[12px] text-ink"
            >
              {s.label}: {s.value}
            </span>
          ))}
        </div>
      ) : null}
      <pre className="max-h-[28rem] overflow-auto rounded-xl border border-line bg-elevated p-4 font-mono text-[12px] leading-relaxed text-ink">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}

function summarize(
  data: unknown,
): Array<{ label: string; value: string }> | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const out: Array<{ label: string; value: string }> = [];
  for (const key of [
    "passed",
    "failed",
    "passRate",
    "total",
    "score",
    "ok",
  ]) {
    if (key in o && (typeof o[key] === "number" || typeof o[key] === "boolean")) {
      out.push({ label: key, value: String(o[key]) });
    }
  }
  if ("summary" in o && o.summary && typeof o.summary === "object") {
    const s = o.summary as Record<string, unknown>;
    for (const [k, v] of Object.entries(s)) {
      if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") {
        out.push({ label: k, value: String(v) });
      }
    }
  }
  return out.length > 0 ? out : null;
}
