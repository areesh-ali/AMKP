import type { TraceRecord, RequestId, TenantId } from "@amkp/domain";

export interface TraceRepository {
  save(trace: TraceRecord): Promise<void>;
  findByRequestId(requestId: RequestId): Promise<TraceRecord | null>;
}

export const TRACE_REPOSITORY = Symbol("TRACE_REPOSITORY");

export class TraceNotFoundError extends Error {
  readonly code = "TRACE_NOT_FOUND";

  constructor(requestId: RequestId) {
    super(`Trace not found: ${requestId}`);
    this.name = "TraceNotFoundError";
  }
}

export class TraceTenantMismatchError extends Error {
  readonly code = "TRACE_TENANT_DENIED";

  constructor(requestId: RequestId, tenantId: TenantId) {
    super(`Trace ${requestId} is not accessible for tenant ${tenantId}`);
    this.name = "TraceTenantMismatchError";
  }
}
