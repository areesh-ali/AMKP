import type { EvidenceEnvelope } from "@amkp/sdk-js";
import { useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import { baseUrl } from "../../../shared/session/vault";
import { AlertBanner } from "../../../shared/ui";
import {
  Composer,
  type RetrieveMode,
} from "../components/Composer";
import { EvidencePanel } from "../components/EvidencePanel";

export function StudioPage() {
  const { session } = useSession();
  const [query, setQuery] = useState(
    "What is the refund window for enterprise seats?",
  );
  const [preferCorrectness, setPreferCorrectness] = useState(true);
  const [mode, setMode] = useState<RetrieveMode>("single_pass");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelope, setEnvelope] = useState<EvidenceEnvelope | null>(null);

  const operatorReady = session?.role === "operator";

  async function runRetrieve() {
    if (!session || session.role !== "operator") return;
    const q = query.trim();
    if (!q) {
      setError("Enter a query to retrieve Evidence.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { tenant } = createPlaneClient(session);
      if (!tenant) throw new Error("Tenant client unavailable");
      const res = await tenant.retrieve({
        query: q,
        preferCorrectness,
        mode,
      });
      setEnvelope(res);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-stream flex-col">
      {!envelope ? (
        <div className="flex flex-1 flex-col items-center justify-center px-2 pb-8 text-center">
          <h2 className="mb-3 font-display text-[36px] font-semibold tracking-[-0.02em] text-ink">
            Ask the plane
          </h2>
          <p className="mb-2 max-w-md text-muted">
            You&apos;ll get Evidence with citations and cost — not an ungrounded
            answer.
          </p>
          <p className="text-[13px] text-muted">
            Active Tenant{" "}
            <span className="font-mono text-ink">
              {session?.activeTenantId ?? "none"}
            </span>{" "}
            · plane <span className="font-mono text-ink">{baseUrl()}</span>
          </p>
          {!operatorReady ? (
            <p className="mt-4 max-w-sm text-sm text-working">
              Sign in as Tenant Operator with an API key to run Retrieve.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 space-y-6 pb-6">
          <p className="text-[13px] text-muted">
            Query · <span className="text-ink">{query}</span>
          </p>
          <EvidencePanel envelope={envelope} />
        </div>
      )}

      {error ? (
        <div className="mb-3">
          <AlertBanner message={error} />
        </div>
      ) : null}

      <Composer
        query={query}
        onQueryChange={setQuery}
        preferCorrectness={preferCorrectness}
        onPreferCorrectnessChange={setPreferCorrectness}
        mode={mode}
        onModeChange={setMode}
        busy={busy}
        disabled={!operatorReady}
        onSubmit={() => void runRetrieve()}
      />
    </div>
  );
}
