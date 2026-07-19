import { useCallback, useEffect, useState } from "react";
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

type AuditRow = {
  id?: string;
  actor?: string;
  action?: string;
  tenantId?: string;
  createdAt?: string;
  at?: string;
};

function asAudit(items: unknown[]): AuditRow[] {
  return items.filter(
    (i): i is AuditRow => typeof i === "object" && i !== null,
  );
}

export function AuditPage() {
  const { session } = useSession();
  const [tenantFilter, setTenantFilter] = useState(
    session?.activeTenantId ?? "",
  );
  const [items, setItems] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || session.role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = await admin.listAudit(50, {
        tenantId: tenantFilter.trim() || undefined,
      });
      setItems(asAudit(res.items));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session, tenantFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Audit"
        description="Actor, action, and time for admin mutations."
      />
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-elevated p-4">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="audit-tenant">Filter Tenant (optional)</Label>
          <Input
            id="audit-tenant"
            mono
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            placeholder="support"
          />
        </div>
        <Button type="button" variant="primary" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      {error ? <AlertBanner message={error} /> : null}
      <div className="overflow-hidden rounded-xl border border-line bg-elevated">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[12px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => {
              const when = row.createdAt ?? row.at;
              return (
                <tr
                  key={row.id ?? `${row.action}-${when}-${idx}`}
                  className="border-b border-line last:border-0"
                >
                  <td className="px-4 py-3 text-muted">
                    {when ? new Date(when).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px]">
                    {row.actor ?? "—"}
                  </td>
                  <td className="px-4 py-3">{row.action ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">
                    {row.tenantId ?? "—"}
                  </td>
                </tr>
              );
            })}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No audit events.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
