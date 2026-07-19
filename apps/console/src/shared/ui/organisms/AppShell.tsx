import { FormEvent, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../session/SessionContext";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";

const titles: Record<string, string> = {
  "/": "Knowledge Studio",
  "/documents": "Documents",
  "/traces": "Traces",
  "/eval": "Eval",
  "/policy": "Tenant policy",
  "/admin/tenants": "Accounts & Tenants",
  "/admin/keys": "API keys",
  "/admin/audit": "Audit",
  "/admin/health": "Health & ops",
  "/onboarding": "Onboarding",
  "/help": "Help / DX",
};

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-sm px-3 py-2 text-sm no-underline transition-colors",
    isActive
      ? "bg-teal-soft font-semibold text-teal"
      : "text-ink hover:bg-canvas",
  ].join(" ");
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mt-4 mb-2 px-3 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
      {children}
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, signOut, setActiveTenantId } = useSession();
  const [tenantDraft, setTenantDraft] = useState(
    session?.activeTenantId ?? "",
  );
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const title = titles[pathname] ?? "AMKP Console";
  const isAdmin = session?.role === "admin";

  function onSignOut() {
    signOut();
    navigate("/sign-in", { replace: true });
  }

  function onTenantSubmit(e: FormEvent) {
    e.preventDefault();
    const next = tenantDraft.trim();
    setActiveTenantId(next.length > 0 ? next : null);
    setSwitcherOpen(false);
  }

  return (
    <div className="grid min-h-screen grid-cols-[var(--spacing-sidebar)_1fr]">
      <aside className="flex flex-col gap-2 border-r border-line bg-elevated px-4 py-5">
        <NavLink
          to={isAdmin ? "/admin/tenants" : "/"}
          className="mb-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink no-underline"
        >
          AMKP
        </NavLink>
        <p className="mb-2 px-1 text-[12px] text-muted">
          {isAdmin ? "Platform Admin" : "Tenant Operator"}
        </p>
        <nav aria-label="Primary" className="flex-1">
          {isAdmin ? (
            <>
              <SectionLabel>Admin</SectionLabel>
              <NavLink to="/admin/tenants" className={navClass}>
                Tenants
              </NavLink>
              <NavLink to="/admin/keys" className={navClass}>
                API keys
              </NavLink>
              <NavLink to="/admin/audit" className={navClass}>
                Audit
              </NavLink>
              <NavLink to="/policy" className={navClass}>
                Policy
              </NavLink>
              <NavLink to="/admin/health" className={navClass}>
                Health
              </NavLink>
            </>
          ) : (
            <>
              <SectionLabel>Workspace</SectionLabel>
              <NavLink to="/" end className={navClass}>
                Studio
              </NavLink>
              <NavLink to="/documents" className={navClass}>
                Documents
              </NavLink>
              <NavLink to="/traces" className={navClass}>
                Traces
              </NavLink>
              <NavLink to="/eval" className={navClass}>
                Eval
              </NavLink>
            </>
          )}
          <SectionLabel>Help</SectionLabel>
          <NavLink to="/onboarding" className={navClass}>
            Onboarding
          </NavLink>
          <NavLink to="/help" className={navClass}>
            SDK / MCP
          </NavLink>
        </nav>
        <Button
          variant="ghost"
          className="mt-2 justify-start text-left"
          onClick={onSignOut}
        >
          Sign out
        </Button>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-elevated px-6 py-3.5">
          <h1 className="m-0 text-base font-semibold">{title}</h1>
          {!isAdmin ? (
            <div className="relative">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-tenant px-2.5 py-1 text-[13px] text-tenant-fg"
                title="Active Tenant label (API key already scopes the plane)"
                onClick={() => setSwitcherOpen((o) => !o)}
              >
                <span className="opacity-70">Tenant</span>{" "}
                {session?.activeTenantId ?? "none"}
              </button>
              {switcherOpen ? (
                <form
                  onSubmit={onTenantSubmit}
                  className="absolute top-full right-0 z-10 mt-2 w-64 rounded-lg border border-line bg-elevated p-3 shadow-[0_8px_24px_rgba(26,25,23,0.08)]"
                >
                  <Label htmlFor="tenant-id">Display Tenant id</Label>
                  <Input
                    id="tenant-id"
                    mono
                    value={tenantDraft}
                    onChange={(e) => setTenantDraft(e.target.value)}
                    placeholder="from /v1/me"
                    className="mb-2"
                  />
                  <Button type="submit" variant="primary" className="w-full">
                    Update label
                  </Button>
                </form>
              ) : null}
            </div>
          ) : (
            <span className="text-[13px] text-muted">Platform Admin</span>
          )}
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
