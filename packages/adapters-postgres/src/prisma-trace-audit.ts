import { ulid } from "ulid";
import type { RequestId, TraceRecord } from "@amkp/domain";
import type { TraceRepository } from "@amkp/application";
import type { PrismaClient } from "./prisma";

/** Durable Trace store (Postgres). */
export class PrismaTraceRepository implements TraceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(trace: TraceRecord): Promise<void> {
    const createdAt = new Date(trace.createdAt);
    const record = JSON.parse(JSON.stringify(trace)) as object;
    await this.prisma.trace.upsert({
      where: { requestId: trace.requestId },
      create: {
        requestId: trace.requestId,
        tenantId: trace.tenantId,
        createdAt,
        record,
      },
      update: {
        tenantId: trace.tenantId,
        createdAt,
        record,
      },
    });
  }

  async findByRequestId(requestId: RequestId): Promise<TraceRecord | null> {
    const row = await this.prisma.trace.findUnique({
      where: { requestId },
    });
    if (!row) return null;
    return row.record as unknown as TraceRecord;
  }
}

/** Durable audit sink (Postgres). */
export class PrismaAuditLog {
  constructor(private readonly prisma: PrismaClient) {}

  async append(entry: {
    action: string;
    actor: string;
    tenantId?: string;
    detail?: Record<string, unknown>;
    at?: string;
  }): Promise<void> {
    const at = entry.at ? new Date(entry.at) : new Date();
    await this.prisma.auditEntry.create({
      data: {
        id: `aud_${ulid()}`,
        action: entry.action,
        actor: entry.actor,
        tenantId: entry.tenantId ?? null,
        detail: entry.detail
          ? (JSON.parse(JSON.stringify(entry.detail)) as object)
          : undefined,
        at,
      },
    });
  }

  async listRecent(
    limit = 50,
    opts?: { tenantId?: string },
  ): Promise<
    Array<{
      action: string;
      actor: string;
      tenantId?: string;
      detail?: Record<string, unknown>;
      at: string;
    }>
  > {
    const rows = await this.prisma.auditEntry.findMany({
      where: opts?.tenantId ? { tenantId: opts.tenantId } : undefined,
      orderBy: { at: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
    });
    return rows.map((r) => ({
      action: r.action,
      actor: r.actor,
      tenantId: r.tenantId ?? undefined,
      detail: (r.detail as Record<string, unknown> | null) ?? undefined,
      at: r.at.toISOString(),
    }));
  }
}
