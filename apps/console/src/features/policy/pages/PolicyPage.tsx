import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Button,
  Input,
  Label,
  PageHeader,
} from "../../../shared/ui";

type TenantPolicy = {
  tenantId?: string;
  name?: string;
  pageVisionEnabled?: boolean;
  agenticEnabled?: boolean;
  preferCorrectnessThreshold?: number;
  agenticReadinessPassed?: boolean;
  agenticOverride?: boolean;
};

export function PolicyPage() {
  const { session } = useSession();
  const [tenantId, setTenantId] = useState(session?.activeTenantId ?? "");
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [threshold, setThreshold] = useState("0.5");
  const [pageVision, setPageVision] = useState(false);
  const [agentic, setAgentic] = useState(false);
  const [agenticOverride, setAgenticOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session || session.role !== "admin" || !tenantId.trim()) {
      setPolicy(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = (await admin.getTenant(tenantId.trim())) as TenantPolicy;
      setPolicy(res);
      setPageVision(Boolean(res.pageVisionEnabled));
      setAgentic(Boolean(res.agenticEnabled));
      setAgenticOverride(Boolean(res.agenticOverride));
      if (typeof res.preferCorrectnessThreshold === "number") {
        setThreshold(String(res.preferCorrectnessThreshold));
      }
    } catch (e) {
      setError(formatApiError(e));
      setPolicy(null);
    } finally {
      setBusy(false);
    }
  }, [session, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!session || session.role !== "admin") return;
    const n = Number(threshold);
    if (!Number.isFinite(n) || n < 0 || n > 1) {
      setError("PreferCorrectness threshold must be between 0 and 1.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = (await admin.updateTenant(tenantId.trim(), {
        pageVisionEnabled: pageVision,
        agenticEnabled: agentic,
        agenticOverride,
        preferCorrectnessThreshold: n,
        actor: "console-policy",
      })) as TenantPolicy;
      setPolicy(res);
      setNotice("Policy saved — check Audit for the change record.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (session?.role === "operator") {
    return (
      <div className="mx-auto max-w-stream space-y-4">
        <PageHeader
          title="Tenant policy"
          description="Policy toggles require Platform Admin. Ask an admin to adjust pageVision, agentic, and PreferCorrectness threshold for your Tenant."
        />
        <p className="text-sm text-muted">
          Active Tenant{" "}
          <span className="font-mono text-ink">
            {session.activeTenantId ?? "none"}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Tenant policy"
        description="pageVision, agentic, and PreferCorrectness threshold — persisted via admin APIs."
      />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1 space-y-1">
          <Label htmlFor="policy-tenant">Tenant ID</Label>
          <Input
            id="policy-tenant"
            mono
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
        </div>
        <Button type="button" onClick={() => void load()} disabled={busy}>
          Load
        </Button>
      </div>
      {error ? <AlertBanner message={error} /> : null}
      {notice ? (
        <p className="rounded-lg border border-line bg-teal-soft px-3 py-2 text-sm text-teal">
          {notice}
        </p>
      ) : null}
      {policy ? (
        <form
          onSubmit={(e) => void onSave(e)}
          className="space-y-4 rounded-xl border border-line bg-elevated p-4"
        >
          <p className="text-sm text-muted">
            {policy.name ?? "Tenant"} ·{" "}
            <span className="font-mono text-[12px]">
              {policy.tenantId ?? tenantId}
            </span>
            {policy.agenticReadinessPassed != null ? (
              <>
                {" "}
                · readiness{" "}
                {policy.agenticReadinessPassed ? "passed" : "not passed"}
              </>
            ) : null}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pageVision}
              onChange={(e) => setPageVision(e.target.checked)}
            />
            pageVisionEnabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agentic}
              onChange={(e) => setAgentic(e.target.checked)}
            />
            agenticEnabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agenticOverride}
              onChange={(e) => setAgenticOverride(e.target.checked)}
            />
            agenticOverride
          </label>
          <div className="max-w-xs space-y-1">
            <Label htmlFor="threshold">PreferCorrectness threshold</Label>
            <Input
              id="threshold"
              mono
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save policy"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
