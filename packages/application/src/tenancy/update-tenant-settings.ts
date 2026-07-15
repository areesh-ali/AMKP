import type { Tenant, TenantId } from "@amkp/domain";
import {
  TenantNotFoundError,
  ValidationError,
  type TenantRepository,
} from "./ports";
import type { AuditLogPort } from "../observability/audit-log";

export class UpdateTenantSettingsUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly audit?: AuditLogPort,
  ) {}

  async execute(input: {
    tenantId: TenantId;
    pageVisionEnabled?: boolean;
    agenticEnabled?: boolean;
    preferCorrectnessThreshold?: number;
    agenticReadinessPassed?: boolean;
    /** Required when enabling agentic without readiness (T-4.2). */
    agenticOverride?: boolean;
    actor?: string;
  }): Promise<Tenant> {
    if (
      input.pageVisionEnabled === undefined &&
      input.agenticEnabled === undefined &&
      input.preferCorrectnessThreshold === undefined &&
      input.agenticReadinessPassed === undefined
    ) {
      throw new ValidationError(
        "At least one settings field is required",
      );
    }

    if (input.preferCorrectnessThreshold !== undefined) {
      const t = input.preferCorrectnessThreshold;
      if (typeof t !== "number" || Number.isNaN(t) || t < 0 || t > 1) {
        throw new ValidationError(
          "preferCorrectnessThreshold must be a number between 0 and 1",
        );
      }
    }

    const existing = await this.tenants.findById(input.tenantId);
    if (!existing) {
      throw new TenantNotFoundError(input.tenantId);
    }

    if (input.agenticEnabled === true && !existing.agenticReadinessPassed) {
      if (input.agenticReadinessPassed !== true && input.agenticOverride !== true) {
        throw new ValidationError(
          "Enabling agentic without Agentic Readiness requires agenticOverride=true",
        );
      }
      if (input.agenticOverride === true) {
        const actor = input.actor?.trim();
        if (!actor) {
          throw new ValidationError(
            "actor is required for audited agentic override",
          );
        }
        await this.audit?.append({
          action: "agentic_override_enable",
          actor,
          tenantId: input.tenantId,
          detail: {
            previousReadiness: existing.agenticReadinessPassed,
            previousAgenticEnabled: existing.agenticEnabled,
          },
        });
      }
    }

    return this.tenants.updateSettings(input.tenantId, {
      pageVisionEnabled: input.pageVisionEnabled,
      agenticEnabled: input.agenticEnabled,
      preferCorrectnessThreshold: input.preferCorrectnessThreshold,
      agenticReadinessPassed: input.agenticReadinessPassed,
    });
  }
}
