import { describe, expect, it } from "vitest";
import {
  AgenticNotEnabledError,
  decideRetrieveRoute,
} from "./router";

describe("decideRetrieveRoute (T-4.1)", () => {
  it("new Tenants default to single-pass with reason code", () => {
    const d = decideRetrieveRoute({
      tenant: { agenticEnabled: false },
    });
    expect(d).toEqual({
      mode: "single_pass",
      reasonCode: "tenant_default_single_pass",
    });
  });

  it("rejects agentic when Tenant is not enabled", () => {
    expect(() =>
      decideRetrieveRoute({
        requestedMode: "agentic",
        tenant: { agenticEnabled: false },
      }),
    ).toThrow(AgenticNotEnabledError);
  });

  it("allows agentic when Tenant.agenticEnabled", () => {
    const d = decideRetrieveRoute({
      requestedMode: "agentic",
      tenant: { agenticEnabled: true },
    });
    expect(d).toEqual({ mode: "agentic", reasonCode: "agentic_enabled" });
  });
});
