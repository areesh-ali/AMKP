import { useCallback, useEffect, useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Badge,
  Button,
  PageHeader,
} from "../../../shared/ui";

export function HealthPage() {
  const { session } = useSession();
  const [health, setHealth] = useState<{
    ok: boolean;
    service?: string;
    adapters?: Record<string, string>;
  } | null>(null);
  const [ready, setReady] = useState<{
    ok: boolean;
    database: string;
    redis?: string;
  } | null>(null);
  const [sweep, setSweep] = useState<{
    scanned: number;
    orphaned: string[];
    deleted: string[];
    dryRun: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || session.role !== "admin") return;
    setBusy(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const [h, r] = await Promise.all([admin.health(), admin.ready()]);
      setHealth(h);
      setReady(r);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSweepDryRun() {
    if (!session || session.role !== "admin") return;
    setBusy(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = await admin.sweepOrphanObjects({ dryRun: true });
      setSweep(res);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSweepDelete() {
    if (!session || session.role !== "admin") return;
    if (
      !window.confirm(
        "Delete orphaned storage objects? This is destructive. Prefer dry-run first.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = await admin.sweepOrphanObjects({ dryRun: false });
      setSweep(res);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Health & ops"
        description="Plane ready state and safe storage ops for Platform Admin."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void refresh()} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh"}
        </Button>
        <Button type="button" onClick={() => void onSweepDryRun()} disabled={busy}>
          Orphan sweep (dry-run)
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => void onSweepDelete()}
          disabled={busy}
        >
          Orphan sweep (delete)
        </Button>
      </div>
      {error ? <AlertBanner message={error} /> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-elevated p-4">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-medium">Health</h2>
            {health ? (
              <Badge tone={health.ok ? "ok" : "danger"}>
                {health.ok ? "ok" : "down"}
              </Badge>
            ) : null}
          </div>
          <pre className="font-mono text-[12px] text-muted whitespace-pre-wrap">
            {health ? JSON.stringify(health, null, 2) : "—"}
          </pre>
        </div>
        <div className="rounded-xl border border-line bg-elevated p-4">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-medium">Ready</h2>
            {ready ? (
              <Badge tone={ready.ok ? "ok" : "danger"}>
                {ready.ok ? "ok" : "not ready"}
              </Badge>
            ) : null}
          </div>
          <pre className="font-mono text-[12px] text-muted whitespace-pre-wrap">
            {ready ? JSON.stringify(ready, null, 2) : "—"}
          </pre>
        </div>
      </section>

      {sweep ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            Sweep result {sweep.dryRun ? "(dry-run)" : "(deleted)"}
          </h2>
          <p className="text-sm">
            scanned <span className="font-mono">{sweep.scanned}</span> · orphaned{" "}
            <span className="font-mono">{sweep.orphaned.length}</span> · deleted{" "}
            <span className="font-mono">{sweep.deleted.length}</span>
          </p>
          <pre className="max-h-64 overflow-auto rounded-xl border border-line bg-elevated p-4 font-mono text-[12px]">
            {JSON.stringify(sweep, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
