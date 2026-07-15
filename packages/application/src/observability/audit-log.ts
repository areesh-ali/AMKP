export interface AuditLogPort {
  append(entry: {
    action: string;
    actor: string;
    tenantId?: string;
    detail?: Record<string, unknown>;
    at?: string;
  }): Promise<void>;
}

export const AUDIT_LOG = Symbol("AUDIT_LOG");

/** In-memory audit sink for MVP / tests (T-4.2). */
export class InMemoryAuditLog implements AuditLogPort {
  readonly entries: Array<{
    action: string;
    actor: string;
    tenantId?: string;
    detail?: Record<string, unknown>;
    at: string;
  }> = [];

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

  clear(): void {
    this.entries.length = 0;
  }
}
