import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "./SessionContext";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (session?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
