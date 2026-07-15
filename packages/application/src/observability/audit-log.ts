export interface AuditEntry {
  action: string;
  actor: string;
  tenantId?: string;
  detail?: Record<string, unknown>;
  at: string;
}

export interface AuditLogPort {
  append(entry: {
    action: string;
    actor: string;
    tenantId?: string;
    detail?: Record<string, unknown>;
    at?: string;
  }): Promise<void>;
  /** Recent entries newest-first (admin inspection). */
  listRecent?(limit?: number): Promise<AuditEntry[]>;
}

export const AUDIT_LOG = Symbol("AUDIT_LOG");

/** In-memory audit sink for MVP / tests (T-4.2). */
export class InMemoryAuditLog implements AuditLogPort {
  readonly entries: AuditEntry[] = [];

  async append(entry: {
    action: string;
    actor: string;
    tenantId?: string;
    detail?: Record<string, unknown>;
    at?: string;
  }): Promise<void> {
    this.entries.push({
      ...entry,
      at: entry.at ?? new Date().toISOString(),
    });
  }

  async listRecent(limit = 50): Promise<AuditEntry[]> {
    return [...this.entries].reverse().slice(0, limit);
  }

  clear(): void {
    this.entries.length = 0;
  }
}
