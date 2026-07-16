import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SignInPage } from "./pages/SignInPage";
import { StudioPage } from "./pages/StudioPage";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<Shell />}>
        <Route index element={<StudioPage />} />
        <Route
          path="documents"
          element={
            <PlaceholderPage
              title="Documents"
              blurb="Upload and track parse status for the Active Tenant."
              cap="CAP-3 · DD-001"
            />
          }
        />
        <Route
          path="traces"
          element={
            <PlaceholderPage
              title="Traces"
              blurb="Inspect router decisions and hops as tool steps."
              cap="CAP-5 · DD-001"
            />
          }
        />
        <Route
          path="eval"
          element={
            <PlaceholderPage
              title="Eval"
              blurb="Golden-set and TableRank reports."
              cap="CAP-6 · DD-004"
            />
          }
        />
        <Route
          path="policy"
          element={
            <PlaceholderPage
              title="Tenant policy"
              blurb="pageVision, agentic, PreferCorrectness threshold."
              cap="CAP-7 · DD-004"
            />
          }
        />
        <Route
          path="admin/tenants"
          element={
            <PlaceholderPage
              title="Accounts & Tenants"
              blurb="Stand up Accounts and Product Tenants."
              cap="CAP-2 · DD-002"
            />
          }
        />
        <Route
          path="admin/keys"
          element={
            <PlaceholderPage
              title="API keys"
              blurb="Issue and rotate keys with one-time reveal."
              cap="CAP-2 · DD-002"
            />
          }
        />
        <Route
          path="admin/audit"
          element={
            <PlaceholderPage
              title="Audit"
              blurb="Actor, action, time for admin mutations."
              cap="CAP-2 · DD-002"
            />
          }
        />
        <Route
          path="admin/health"
          element={
            <PlaceholderPage
              title="Health & ops"
              blurb="Plane ready state and safe ops actions."
              cap="CAP-8 · DD-002"
            />
          }
        />
        <Route
          path="onboarding"
          element={
            <PlaceholderPage
              title="Onboarding runway"
              blurb="Guided path to first Evidence in under 60 minutes."
              cap="CAP-9 · DD-003"
            />
          }
        />
        <Route
          path="help"
          element={
            <PlaceholderPage
              title="Help / DX"
              blurb="SDK, MCP, and OpenAPI remain first-class builder surfaces."
              cap="DX kit"
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
