/** In-memory Trace store for MVP / tests (T-6.1). */
import type { RequestId, TraceRecord } from "@amkp/domain";
import type { TraceRepository } from "@amkp/application";

export class InMemoryTraceRepository implements TraceRepository {
  private readonly byId = new Map<string, TraceRecord>();

  async save(trace: TraceRecord): Promise<void> {
    this.byId.set(trace.requestId, { ...trace });
  }

  async findByRequestId(requestId: RequestId): Promise<TraceRecord | null> {
    return this.byId.get(requestId) ?? null;
  }

  clear(): void {
    this.byId.clear();
  }
}

export {
  PrismaTraceRepository,
  PrismaAuditLog,
} from "./prisma-trace-audit";
