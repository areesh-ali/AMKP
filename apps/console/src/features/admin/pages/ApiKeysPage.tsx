import type { ApiKeySummary } from "@amkp/sdk-js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Badge,
  Button,
  Input,
  Label,
  OneTimeSecret,
  PageHeader,
} from "../../../shared/ui";

export function ApiKeysPage() {
  const { session } = useSession();
  const [tenantId, setTenantId] = useState(session?.activeTenantId ?? "");
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || session.role !== "admin" || !tenantId.trim()) {
      setKeys([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const res = await admin.listApiKeys(tenantId.trim());
      setKeys(res.items);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session, tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onIssue(e: FormEvent) {
    e.preventDefault();
    if (!session || !tenantId.trim()) return;
    setPlaintext(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const issued = await admin.createApiKey(tenantId.trim());
      setPlaintext(issued.apiKey);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function onRevoke(apiKeyId: string) {
    if (!session || !tenantId.trim()) return;
    if (!confirm("Revoke this key? Plane calls with it will 401.")) return;
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      await admin.revokeApiKey(tenantId.trim(), apiKeyId);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function onRotate(apiKeyId: string) {
    if (!session || !tenantId.trim()) return;
    if (!confirm("Rotate this key? Old key is revoked; new plaintext shown once."))
      return;
    setPlaintext(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const rotated = await admin.rotateApiKey(tenantId.trim(), apiKeyId);
      setPlaintext(rotated.apiKey);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="API keys"
        description="Issue, revoke, and rotate Tenant keys. Plaintext is shown once."
      />
      <form
        onSubmit={onIssue}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-elevated p-4"
      >
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="key-tenant">Tenant id</Label>
          <Input
            id="key-tenant"
            mono
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="support"
            required
          />
        </div>
        <Button type="submit" variant="primary">
          Issue key
        </Button>
        <Button type="button" onClick={() => void refresh()}>
          Refresh
        </Button>
      </form>
      {error ? <AlertBanner message={error} /> : null}
      {plaintext ? (
        <OneTimeSecret value={plaintext} onDismiss={() => setPlaintext(null)} />
      ) : null}
      <div className="overflow-hidden rounded-xl border border-line bg-elevated">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[12px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Key id</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const revoked = Boolean(k.revokedAt);
              return (
                <tr key={k.apiKeyId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-[12px]">{k.apiKeyId}</td>
                  <td className="px-4 py-3 text-muted">
                    {k.createdAt ? new Date(k.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={revoked ? "danger" : "ok"}>
                      {revoked ? "revoked" : "active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {!revoked ? (
                      <span className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="cursor-pointer text-[13px] text-teal"
                          onClick={() => void onRotate(k.apiKeyId)}
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer text-[13px] text-danger"
                          onClick={() => void onRevoke(k.apiKeyId)}
                        >
                          Revoke
                        </button>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && keys.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {tenantId.trim()
                    ? "No keys for this Tenant."
                    : "Enter a Tenant id to list keys."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
