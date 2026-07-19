import { Navigate, Route, Routes } from "react-router-dom";
import { ApiKeysPage } from "../features/admin/pages/ApiKeysPage";
import { AuditPage } from "../features/admin/pages/AuditPage";
import { TenantsPage } from "../features/admin/pages/TenantsPage";
import { SignInPage } from "../features/auth/pages/SignInPage";
import { DocumentDetailPage } from "../features/documents/pages/DocumentDetailPage";
import { DocumentsPage } from "../features/documents/pages/DocumentsPage";
import { EvalPage } from "../features/eval/pages/EvalPage";
import { HelpPage } from "../features/help/pages/HelpPage";
import { OnboardingPage } from "../features/onboarding/pages/OnboardingPage";
import { HealthPage } from "../features/ops/pages/HealthPage";
import { PolicyPage } from "../features/policy/pages/PolicyPage";
import { StudioPage } from "../features/studio/pages/StudioPage";
import { TracesPage } from "../features/traces/pages/TracesPage";
import { AdminOnly } from "../shared/session/AdminOnly";
import { RequireAuth } from "../shared/session/RequireAuth";
import { AppShell } from "../shared/ui";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<StudioPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="traces" element={<TracesPage />} />
          <Route path="eval" element={<EvalPage />} />
          <Route path="policy" element={<PolicyPage />} />
          <Route
            path="admin/tenants"
            element={
              <AdminOnly>
                <TenantsPage />
              </AdminOnly>
            }
          />
          <Route
            path="admin/keys"
            element={
              <AdminOnly>
                <ApiKeysPage />
              </AdminOnly>
            }
          />
          <Route
            path="admin/audit"
            element={
              <AdminOnly>
                <AuditPage />
              </AdminOnly>
            }
          />
          <Route
            path="admin/health"
            element={
              <AdminOnly>
                <HealthPage />
              </AdminOnly>
            }
          />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
