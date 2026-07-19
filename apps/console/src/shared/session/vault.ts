export type ConsoleRole = "admin" | "operator";

export type ConsoleSession = {
  role: ConsoleRole;
  /** PLATFORM_ADMIN_TOKEN or tenant API key (amkp_…). */
  credential: string;
  /** Active Tenant id/slug for Operator surfaces; null for Admin until selected. */
  activeTenantId: string | null;
};

const KEY = "amkp.console.session.v1";

export function readSession(): ConsoleSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsoleSession;
    if (
      (parsed.role !== "admin" && parsed.role !== "operator") ||
      typeof parsed.credential !== "string" ||
      parsed.credential.length === 0
    ) {
      return null;
    }
    return {
      role: parsed.role,
      credential: parsed.credential,
      activeTenantId:
        typeof parsed.activeTenantId === "string"
          ? parsed.activeTenantId
          : null,
    };
  } catch {
    return null;
  }
}

export function writeSession(session: ConsoleSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}

export function baseUrl(): string {
  return import.meta.env.VITE_AMKP_BASE_URL ?? "http://127.0.0.1:3000";
}
