import type { FormEvent } from "react";
import { Button, Textarea } from "../../../shared/ui";

export type RetrieveMode = "single_pass" | "agentic";

export function Composer({
  query,
  onQueryChange,
  preferCorrectness,
  onPreferCorrectnessChange,
  mode,
  onModeChange,
  busy,
  onSubmit,
  disabled,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  preferCorrectness: boolean;
  onPreferCorrectnessChange: (v: boolean) => void;
  mode: RetrieveMode;
  onModeChange: (m: RetrieveMode) => void;
  busy: boolean;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!busy && !disabled) onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 rounded-2xl border border-line bg-elevated p-4 shadow-[0_8px_24px_rgba(26,25,23,0.06)]"
    >
      <label className="sr-only" htmlFor="studio-query">
        Query
      </label>
      <Textarea
        id="studio-query"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Ask about your Tenant knowledge…"
        disabled={busy || disabled}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (!busy && !disabled) onSubmit();
          }
        }}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
        <span className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={preferCorrectness}
              onChange={(e) => onPreferCorrectnessChange(e.target.checked)}
              disabled={busy || disabled}
            />
            PreferCorrectness
          </label>
          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">Mode</span>
            <select
              className="rounded-md border border-line bg-canvas px-2 py-1 text-[13px] text-ink"
              value={mode}
              onChange={(e) => onModeChange(e.target.value as RetrieveMode)}
              disabled={busy || disabled}
            >
              <option value="single_pass">single_pass</option>
              <option value="agentic">agentic</option>
            </select>
          </label>
        </span>
        <Button type="submit" variant="primary" disabled={busy || disabled}>
          {busy ? "Retrieving…" : "Run ⌘⏎"}
        </Button>
      </div>
    </form>
  );
}
