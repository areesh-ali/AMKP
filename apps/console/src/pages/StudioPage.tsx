import { useState } from "react";

const baseUrl = import.meta.env.VITE_AMKP_BASE_URL ?? "http://localhost:3000";

export function StudioPage() {
  const [query, setQuery] = useState(
    "What is the refund window for enterprise seats?",
  );

  return (
    <div className="max-w-stream">
      <h2 className="mb-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-ink">
        Ask the plane
      </h2>
      <p className="mb-6 text-muted">
        You&apos;ll get Evidence with citations and cost — not an ungrounded
        answer. Wire retrieve via{" "}
        <span className="font-mono text-[13px]">@amkp/sdk-js</span> against{" "}
        <span className="font-mono text-[13px]">{baseUrl}</span>.
      </p>

      <div className="rounded-lg border border-line bg-elevated p-4">
        <label className="sr-only" htmlFor="studio-query">
          Query
        </label>
        <textarea
          id="studio-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your Tenant knowledge…"
          className="min-h-[72px] w-full resize-y border-0 bg-transparent outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
          <span>[+ attach] · PreferCorrectness · single_pass</span>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-teal bg-teal px-4 py-2.5 text-teal-fg opacity-50"
          >
            Run ⌘⏎
          </button>
        </div>
      </div>
      <p className="mt-4 text-[13px] text-muted">
        C-1.1 shell · Tailwind theme · DD-001 Studio path next. Prototype:{" "}
        <span className="font-mono">
          _bmad-output/C-UX-Scenarios/02-kens-knowledge-studio/prototype-knowledge-studio.html
        </span>
      </p>
    </div>
  );
}
