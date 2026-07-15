import type { Tenant } from "@amkp/domain";

export type RouterMode = "single_pass" | "agentic";

export type RouterReasonCode =
  | "tenant_default_single_pass"
  | "agentic_enabled"
  | "agentic_not_enabled"
  | "default";

export class AgenticNotEnabledError extends Error {
  readonly code = "AGENTIC_NOT_ENABLED";

  constructor() {
    super(
      "Agentic mode is not enabled for this Tenant; use single-pass or enable agentic after readiness",
    );
    this.name = "AgenticNotEnabledError";
  }
}

/**
 * Complexity router decision (AD-8 / T-4.1).
 * New Tenants default single-pass; agentic requires Tenant.agenticEnabled.
 */
export function decideRetrieveRoute(input: {
  requestedMode?: RouterMode;
  tenant: Pick<Tenant, "agenticEnabled"> | null | undefined;
}): { mode: RouterMode; reasonCode: RouterReasonCode } {
  const requested = input.requestedMode ?? "single_pass";
  const agenticEnabled = input.tenant?.agenticEnabled === true;

  if (requested === "agentic") {
    if (!agenticEnabled) {
      throw new AgenticNotEnabledError();
    }
    return { mode: "agentic", reasonCode: "agentic_enabled" };
  }

  if (!agenticEnabled) {
    return { mode: "single_pass", reasonCode: "tenant_default_single_pass" };
  }

  return { mode: "single_pass", reasonCode: "default" };
}
