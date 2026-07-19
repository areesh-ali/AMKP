import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  readSession,
  writeSession,
  type ConsoleRole,
  type ConsoleSession,
} from "./vault";

type SessionContextValue = {
  session: ConsoleSession | null;
  signIn: (role: ConsoleRole, credential: string) => void;
  signOut: () => void;
  setActiveTenantId: (tenantId: string | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ConsoleSession | null>(() =>
    readSession(),
  );

  const signIn = useCallback((role: ConsoleRole, credential: string) => {
    const next: ConsoleSession = {
      role,
      credential: credential.trim(),
      activeTenantId: role === "operator" ? "support" : null,
    };
    writeSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const setActiveTenantId = useCallback((tenantId: string | null) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, activeTenantId: tenantId };
      writeSession(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut, setActiveTenantId }),
    [session, signIn, signOut, setActiveTenantId],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
