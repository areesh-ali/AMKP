import { NavLink, Outlet, useLocation } from "react-router-dom";

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

export function Shell() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "AMKP Console";

  return (
    <div className="grid min-h-screen grid-cols-[var(--spacing-sidebar)_1fr]">
      <aside className="flex flex-col gap-2 border-r border-line bg-elevated px-4 py-5">
        <NavLink
          to="/"
          className="mb-4 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink no-underline"
        >
          AMKP
        </NavLink>
        <nav aria-label="Workspace">
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
          <NavLink to="/policy" className={navClass}>
            Policy
          </NavLink>
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
          <NavLink to="/admin/health" className={navClass}>
            Health
          </NavLink>
          <SectionLabel>Help</SectionLabel>
          <NavLink to="/onboarding" className={navClass}>
            Onboarding
          </NavLink>
          <NavLink to="/help" className={navClass}>
            SDK / MCP
          </NavLink>
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-line bg-elevated px-6 py-3.5">
          <h1 className="m-0 text-base font-semibold">{title}</h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-sm bg-tenant px-2.5 py-1 text-[13px] text-tenant-fg"
            title="Active Tenant"
          >
            <span className="opacity-70">Tenant</span> support
          </span>
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
