import { FormEvent, useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Button,
  PageHeader,
  Textarea,
} from "../../../shared/ui";
import { EvalReport } from "../components/EvalReport";

const DEFAULT_GOLDEN = `[
  {
    "id": "q1",
    "question": "What is the refund window?",
    "expectedKeywords": ["refund", "days"]
  }
]`;

const DEFAULT_TABLE = `["What is the unit price in the pricing table?"]`;

export function EvalPage() {
  const { session } = useSession();
  const [goldenJson, setGoldenJson] = useState(DEFAULT_GOLDEN);
  const [tableJson, setTableJson] = useState(DEFAULT_TABLE);
  const [goldenReport, setGoldenReport] = useState<unknown>(null);
  const [tableReport, setTableReport] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (session?.role === "admin") {
    return (
      <div className="mx-auto max-w-stream">
        <PageHeader
          title="Eval"
          description="Sign in as Tenant Operator to run golden-set and TableRank evals."
        />
      </div>
    );
  }

  async function runGolden(e: FormEvent) {
    e.preventDefault();
    if (!session || session.role !== "operator") return;
    setBusy("golden");
    setError(null);
    try {
      const questions = JSON.parse(goldenJson) as Array<{
        id: string;
        question: string;
        expectedDocumentIds?: string[];
        expectedKeywords?: string[];
      }>;
      const { tenant } = createPlaneClient(session);
      if (!tenant) return;
      const res = await tenant.runGoldenEval({ questions });
      setGoldenReport(res);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(null);
    }
  }

  async function runTable(e: FormEvent) {
    e.preventDefault();
    if (!session || session.role !== "operator") return;
    setBusy("table");
    setError(null);
    try {
      const queries = JSON.parse(tableJson) as string[];
      const { tenant } = createPlaneClient(session);
      if (!tenant) return;
      const res = await tenant.runTableRankEval({ queries });
      setTableReport(res);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-stream space-y-8">
      <PageHeader
        title="Eval"
        description="Run golden-set and TableRank reports for the Active Tenant."
      />
      <p className="text-sm text-muted">
        POC Pack entry point in-repo:{" "}
        <span className="font-mono text-ink">docs/poc-pack.md</span> (fixtures +
        judge notes, no sales gate).
      </p>
      {error ? <AlertBanner message={error} /> : null}

      <form onSubmit={(e) => void runGolden(e)} className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          Golden-set
        </h2>
        <div className="rounded-xl border border-line bg-elevated p-3">
          <Textarea
            value={goldenJson}
            onChange={(e) => setGoldenJson(e.target.value)}
            className="min-h-[10rem] font-mono text-[12px]"
          />
        </div>
        <Button type="submit" variant="primary" disabled={busy !== null}>
          {busy === "golden" ? "Running…" : "Run golden-set"}
        </Button>
      </form>
      {goldenReport != null ? (
        <EvalReport title="Golden-set report" data={goldenReport} />
      ) : null}

      <form onSubmit={(e) => void runTable(e)} className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
          TableRank
        </h2>
        <div className="rounded-xl border border-line bg-elevated p-3">
          <Textarea
            value={tableJson}
            onChange={(e) => setTableJson(e.target.value)}
            className="min-h-[6rem] font-mono text-[12px]"
          />
        </div>
        <Button type="submit" variant="primary" disabled={busy !== null}>
          {busy === "table" ? "Running…" : "Run TableRank"}
        </Button>
      </form>
      {tableReport != null ? (
        <EvalReport title="TableRank report" data={tableReport} />
      ) : null}
    </div>
  );
}
