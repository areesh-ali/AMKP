import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "./SessionContext";

export function RequireAuth() {
  const { session } = useSession();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
