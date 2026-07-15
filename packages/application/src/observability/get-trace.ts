import type { EvidenceEnvelope, TraceRecord } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";
import {
  TraceNotFoundError,
  TraceTenantMismatchError,
  type TraceRepository,
} from "./trace-ports";

export function evidenceEnvelopeToTrace(
  envelope: EvidenceEnvelope,
  createdAt = new Date().toISOString(),
): TraceRecord {
  const evidenceIds =
    envelope.outcome.kind === "evidence"
      ? envelope.outcome.items.map((i) => i.id)
      : [];

  return {
    requestId: envelope.requestId,
    tenantId: envelope.tenantId,
    createdAt,
    routerDecision: envelope.routerDecision ?? {
      mode: "single_pass",
      reasonCode: "default",
    },
    evidenceIds,
    outcomeKind: envelope.outcome.kind,
    costEstimate: envelope.costEstimate,
  };
}

export class RecordRetrieveTraceUseCase {
  constructor(private readonly traces: TraceRepository) {}

  async execute(envelope: EvidenceEnvelope): Promise<void> {
    await this.traces.save(evidenceEnvelopeToTrace(envelope));
  }
}

export class GetTraceUseCase {
  constructor(private readonly traces: TraceRepository) {}

  async execute(
    ctx: TenantContext | undefined | null,
    requestId: string,
  ): Promise<TraceRecord> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const id = requestId?.trim();
    if (!id) {
      throw new ValidationError("requestId is required");
    }

    const trace = await this.traces.findByRequestId(id);
    if (!trace) {
      throw new TraceNotFoundError(id);
    }
    if (trace.tenantId !== ctx.tenantId) {
      throw new TraceTenantMismatchError(id, ctx.tenantId);
    }
    return trace;
  }
}
