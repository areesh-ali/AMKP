import type { Tenant } from "@amkp/domain";

export type RouterMode = "single_pass" | "agentic";

export type RouterReasonCode =
  | "tenant_default_single_pass"
  | "agentic_enabled"
  | "agentic_readiness_required"
  | "default";

export class AgenticNotEnabledError extends Error {
  readonly code = "AGENTIC_NOT_ENABLED";

  constructor() {
    super(
      "Agentic mode is not enabled for this Tenant; enable after Agentic Readiness or audited override",
    );
    this.name = "AgenticNotEnabledError";
  }
}

export class AgenticReadinessRequiredError extends Error {
  readonly code = "AGENTIC_READINESS_REQUIRED";

  constructor() {
    super(
      "Agentic Readiness gate has not passed for this Tenant; complete readiness or use an audited override",
    );
    this.name = "AgenticReadinessRequiredError";
  }
}

/**
 * Complexity router (AD-8 / T-4.1 / T-4.2).
 * mode=agentic requires agenticEnabled; readiness must have passed unless
 * agentic was enabled via audited override (agenticEnabled without readiness).
 */
export function decideRetrieveRoute(input: {
  requestedMode?: RouterMode;
  tenant:
    | Pick<Tenant, "agenticEnabled" | "agenticReadinessPassed">
    | null
    | undefined;
}): { mode: RouterMode; reasonCode: RouterReasonCode } {
  const requested = input.requestedMode ?? "single_pass";
  const agenticEnabled = input.tenant?.agenticEnabled === true;
  const readiness = input.tenant?.agenticReadinessPassed === true;

  if (requested === "agentic") {
    if (!readiness && !agenticEnabled) {
      throw new AgenticReadinessRequiredError();
    }
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
