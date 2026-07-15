import { describe, expect, it } from "vitest";
import {
  AgenticNotEnabledError,
  AgenticReadinessRequiredError,
  decideRetrieveRoute,
} from "./router";

describe("decideRetrieveRoute (T-4.1 / T-4.2)", () => {
  it("new Tenants default to single-pass with reason code", () => {
    const d = decideRetrieveRoute({
      tenant: { agenticEnabled: false, agenticReadinessPassed: false },
    });
    expect(d).toEqual({
      mode: "single_pass",
      reasonCode: "tenant_default_single_pass",
    });
  });

  it("rejects agentic when readiness gate not passed", () => {
    expect(() =>
      decideRetrieveRoute({
        requestedMode: "agentic",
        tenant: { agenticEnabled: false, agenticReadinessPassed: false },
      }),
    ).toThrow(AgenticReadinessRequiredError);
  });

  it("rejects agentic when readiness passed but not enabled", () => {
    expect(() =>
      decideRetrieveRoute({
        requestedMode: "agentic",
        tenant: { agenticEnabled: false, agenticReadinessPassed: true },
      }),
    ).toThrow(AgenticNotEnabledError);
  });

  it("allows agentic when enabled (readiness or audited override)", () => {
    const d = decideRetrieveRoute({
      requestedMode: "agentic",
      tenant: { agenticEnabled: true, agenticReadinessPassed: false },
    });
    expect(d).toEqual({ mode: "agentic", reasonCode: "agentic_enabled" });
  });
});
