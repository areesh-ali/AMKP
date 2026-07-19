import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPlaneClient } from "../../../shared/api/client";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import {
  AlertBanner,
  Button,
  FormCard,
  Input,
  Label,
  OneTimeSecret,
  PageHeader,
} from "../../../shared/ui";

type AccountRow = { accountId: string; name: string };
type TenantRow = { tenantId: string; name?: string };

function asAccounts(items: unknown[]): AccountRow[] {
  return items.filter(
    (i): i is AccountRow =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as AccountRow).accountId === "string",
  );
}

function asTenants(items: unknown[]): TenantRow[] {
  return items.filter(
    (i): i is TenantRow =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as TenantRow).tenantId === "string",
  );
}

export function TenantsPage() {
  const { session, setActiveTenantId } = useSession();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [accountName, setAccountName] = useState("Acme");
  const [tenantName, setTenantName] = useState("support");
  const [accountIdForTenant, setAccountIdForTenant] = useState("");
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session || session.role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) throw new Error("Admin client unavailable");
      const [a, t] = await Promise.all([
        admin.listAccounts(),
        admin.listTenants({ limit: 100 }),
      ]);
      const acc = asAccounts(a.items);
      const ten = asTenants(t.items);
      setAccounts(acc);
      setTenants(ten);
      if (!accountIdForTenant && acc[0]) setAccountIdForTenant(acc[0].accountId);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [session, accountIdForTenant]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.credential]);

  async function onCreateAccount(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const created = await admin.createAccount(accountName.trim());
      setAccountIdForTenant(created.accountId);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function onCreateTenant(e: FormEvent) {
    e.preventDefault();
    if (!session || !accountIdForTenant) return;
    setIssuedKey(null);
    try {
      const { admin } = createPlaneClient(session);
      if (!admin) return;
      const created = await admin.createTenant(
        accountIdForTenant,
        tenantName.trim(),
      );
      setIssuedKey(created.apiKey);
      setActiveTenantId(created.tenantId);
      await refresh();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-stream space-y-8">
      <PageHeader
        title="Accounts & Tenants"
        description="Stand up Product Tenants for hard isolation. Keys issued once on create."
      />
      {error ? <AlertBanner message={error} /> : null}
      <section className="grid gap-6 md:grid-cols-2">
        <FormCard title="Create Account" onSubmit={onCreateAccount}>
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="mb-3"
            required
          />
          <Button type="submit" variant="primary">
            Create Account
          </Button>
        </FormCard>
        <FormCard title="Create Tenant" onSubmit={onCreateTenant}>
          <Label>Account</Label>
          <select
            value={accountIdForTenant}
            onChange={(e) => setAccountIdForTenant(e.target.value)}
            className="mb-3 w-full rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-[13px]"
            required
          >
            {accounts.length === 0 ? (
              <option value="">Create an account first</option>
            ) : (
              accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  {a.name} ({a.accountId})
                </option>
              ))
            )}
          </select>
          <Label>Tenant name / slug</Label>
          <Input
            mono
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className="mb-3"
            required
          />
          <Button type="submit" variant="primary" disabled={!accountIdForTenant}>
            Create Tenant
          </Button>
        </FormCard>
      </section>
      {issuedKey ? (
        <OneTimeSecret value={issuedKey} onDismiss={() => setIssuedKey(null)} />
      ) : null}
      <section>
        <h3 className="mb-2 text-sm font-semibold">
          Accounts {loading ? "…" : `(${accounts.length})`}
        </h3>
        <ul className="divide-y divide-line rounded-xl border border-line bg-elevated">
          {accounts.map((a) => (
            <li key={a.accountId} className="px-4 py-3 text-sm">
              <span className="font-medium">{a.name}</span>{" "}
              <span className="font-mono text-[12px] text-muted">{a.accountId}</span>
            </li>
          ))}
          {!loading && accounts.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No accounts yet.</li>
          ) : null}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">
          Tenants {loading ? "…" : `(${tenants.length})`}
        </h3>
        <ul className="divide-y divide-line rounded-xl border border-line bg-elevated">
          {tenants.map((t) => (
            <li
              key={t.tenantId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{t.name ?? t.tenantId}</span>{" "}
                <span className="font-mono text-[12px] text-muted">
                  {t.tenantId}
                </span>
              </div>
              <Button
                variant="secondary"
                className="px-2 py-1 text-[12px]"
                onClick={() => setActiveTenantId(t.tenantId)}
              >
                Set Active
              </Button>
            </li>
          ))}
          {!loading && tenants.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No tenants yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
