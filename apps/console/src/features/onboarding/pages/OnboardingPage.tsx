import { Link } from "react-router-dom";
import { useSession } from "../../../shared/session/SessionContext";
import { PageHeader } from "../../../shared/ui";

const steps = [
  {
    n: 1,
    title: "Create Account & Tenant",
    blurb: "Platform Admin stands up a Tenant and copies the one-time API key.",
    to: "/admin/tenants",
    admin: true,
  },
  {
    n: 2,
    title: "Sign in as Operator",
    blurb: "Use the Tenant API key; set Active Tenant in the chrome.",
    to: "/sign-in",
    admin: false,
  },
  {
    n: 3,
    title: "Ingest a document",
    blurb: "Upload a fixture under Documents and wait for parsed status.",
    to: "/documents",
    admin: false,
  },
  {
    n: 4,
    title: "Run Retrieve",
    blurb: "Ask in Studio — climax is Evidence + citations + cost.",
    to: "/",
    admin: false,
  },
  {
    n: 5,
    title: "Inspect the Trace",
    blurb: "Open the requestId from Evidence to see router hops.",
    to: "/traces",
    admin: false,
  },
] as const;

export function OnboardingPage() {
  const { session } = useSession();
  const isAdmin = session?.role === "admin";

  return (
    <div className="mx-auto max-w-stream space-y-6">
      <PageHeader
        title="Onboarding runway"
        description="Guided path to first Evidence in under 60 minutes — Console + running plane only."
      />
      <ol className="space-y-3">
        {steps.map((s) => {
          const locked = s.admin && !isAdmin;
          return (
            <li
              key={s.n}
              className="flex gap-4 rounded-xl border border-line bg-elevated px-4 py-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft font-mono text-sm font-medium text-teal">
                {s.n}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-ink">{s.title}</h2>
                <p className="mt-1 text-sm text-muted">{s.blurb}</p>
                {locked ? (
                  <p className="mt-2 text-[12px] text-working">
                    Requires Platform Admin session
                  </p>
                ) : (
                  <Link
                    to={s.to}
                    className="mt-2 inline-block text-sm font-medium text-teal hover:underline"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
