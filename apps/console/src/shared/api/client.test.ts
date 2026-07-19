import { describe, expect, it } from "vitest";
import { createPlaneClient } from "./client";

describe("createPlaneClient", () => {
  it("gives admin client only for admin sessions", () => {
    const { admin, tenant } = createPlaneClient({
      role: "admin",
      credential: "admin-token",
      activeTenantId: null,
    });
    expect(admin).not.toBeNull();
    expect(tenant).toBeNull();
  });

  it("gives tenant client only for operator sessions", () => {
    const { admin, tenant } = createPlaneClient({
      role: "operator",
      credential: "amkp_key",
      activeTenantId: "support",
    });
    expect(tenant).not.toBeNull();
    expect(admin).toBeNull();
  });
});
