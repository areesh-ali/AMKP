import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AmkpAdminClient, AmkpClient } from "@amkp/sdk-js";
import { formatApiError } from "../../../shared/api/errors";
import { useSession } from "../../../shared/session/SessionContext";
import { baseUrl, type ConsoleRole } from "../../../shared/session/vault";
import { AlertBanner, Button, Input, Label } from "../../../shared/ui";

export function SignInPage() {
  const navigate = useNavigate();
  const { session, signIn } = useSession();
  const [role, setRole] = useState<ConsoleRole>("operator");
  const [credential, setCredential] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) {
    return (
      <Navigate
        to={session.role === "admin" ? "/admin/tenants" : "/"}
        replace
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = credential.trim();
    if (!trimmed) {
      setError("Credential is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = baseUrl() || window.location.origin;
      if (role === "admin") {
        const admin = new AmkpAdminClient({
          baseUrl: url,
          adminToken: trimmed,
        });
        await admin.listAccounts(1);
        signIn("admin", trimmed, null);
        navigate("/admin/tenants", { replace: true });
      } else {
        const tenant = new AmkpClient({ baseUrl: url, apiKey: trimmed });
        const me = await tenant.me();
        signIn("operator", trimmed, me.tenantId);
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(
        `${formatApiError(err)} — check role, credential, and that the plane is reachable (${baseUrl() || "same-origin"}). CORS needs AMKP_CORS_ORIGINS for local Vite.`,
      );
    } finally {
      setBusy(false);
    }
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
        className="w-full max-w-[420px] rounded-xl border border-line bg-elevated px-9 py-10 shadow-[0_8px_24px_rgba(26,25,23,0.06)]"
        onSubmit={(e) => void onSubmit(e)}
      >
        <h1 className="mb-2 font-display text-[40px] font-semibold tracking-[-0.02em]">
          AMKP
        </h1>
        <p className="mt-0 mb-7 text-muted">
          Console — operate the knowledge plane
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
              className={[
                "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm",
                role === value
                  ? "border-teal bg-teal-soft font-medium text-teal"
                  : "border-line bg-canvas font-normal text-ink",
              ].join(" ")}
            >
              <input
                type="radio"
                name="role"
                className="sr-only"
                checked={role === value}
                onChange={() => setRole(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <Label htmlFor="credential" className="text-[13px] text-ink">
          Credential
        </Label>
        <Input
          id="credential"
          type="password"
          mono
          value={credential}
          onChange={(e) => {
            setCredential(e.target.value);
            setError(null);
          }}
          placeholder="PLATFORM_ADMIN_TOKEN or amkp_…"
          autoComplete="current-password"
          required
          className="mb-2"
        />
        {error ? (
          <div className="mb-3">
            <AlertBanner message={error} />
          </div>
        ) : (
          <p className="mb-4 text-[12px] text-muted">
            Dev vault: credential stays in this tab&apos;s sessionStorage only.
            Not a production auth model — use a BFF/httpOnly session before
            internet exposure.
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={busy}
        >
          {busy ? "Verifying…" : "Continue"}
        </Button>
        <p className="mt-4 text-[13px] text-muted">
          SDK &amp; MCP remain for builders. Console operates the plane — it does
          not replace them.
        </p>
      </form>
    </main>
  );
}
