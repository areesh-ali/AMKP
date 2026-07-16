import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

type Role = "admin" | "operator";

export function SignInPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("operator");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("amkp.console.role", role);
    navigate(role === "admin" ? "/admin/tenants" : "/");
  }

  return (
    <main
      className="grid min-h-screen place-items-center p-8"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, #ccfbf166, transparent), radial-gradient(900px 500px at 100% 0%, #e5e2dc66, transparent), var(--color-canvas)",
      }}
    >
      <form
        className="w-full max-w-[420px] rounded-md border border-line bg-elevated px-9 py-10 shadow-[0_8px_24px_rgba(26,25,23,0.06)]"
        onSubmit={onSubmit}
      >
        <h1 className="mb-2 font-display text-[40px] font-semibold tracking-[-0.02em]">
          AMKP
        </h1>
        <p className="mt-0 mb-7 text-muted">
          Enterprise knowledge plane — Console
        </p>
        <div className="mb-6 flex gap-2" role="radiogroup" aria-label="Role">
          {(
            [
              ["admin", "Platform Admin"],
              ["operator", "Tenant Operator"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-canvas px-3 py-2 text-sm font-normal"
            >
              <input
                type="radio"
                name="role"
                checked={role === value}
                onChange={() => setRole(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <label
          htmlFor="credential"
          className="mb-1.5 block text-[13px] font-medium"
        >
          Credential
        </label>
        <input
          id="credential"
          type="password"
          placeholder="PLATFORM_ADMIN_TOKEN or amkp_…"
          autoComplete="current-password"
          className="mb-4 w-full rounded-md border border-line px-3 py-3 font-mono text-[13px]"
        />
        <button
          type="submit"
          className="w-full cursor-pointer rounded-md border border-teal bg-teal px-4 py-2.5 text-teal-fg"
        >
          Continue
        </button>
        <p className="mt-4 text-[13px] text-muted">
          SDK &amp; MCP remain for builders. Console operates the plane — it does
          not replace them.
        </p>
      </form>
    </main>
  );
}
