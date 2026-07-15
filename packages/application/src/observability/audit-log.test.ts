import { describe, expect, it } from "vitest";
import { InMemoryAuditLog } from "./audit-log";

describe("InMemoryAuditLog", () => {
  it("filters listRecent by tenantId", async () => {
    const log = new InMemoryAuditLog();
    await log.append({ action: "a", actor: "x", tenantId: "ten_a" });
    await log.append({ action: "b", actor: "x", tenantId: "ten_b" });
    await log.append({ action: "c", actor: "x", tenantId: "ten_a" });

    const all = await log.listRecent(10);
    expect(all).toHaveLength(3);

    const onlyA = await log.listRecent(10, { tenantId: "ten_a" });
    expect(onlyA.map((e) => e.action)).toEqual(["c", "a"]);
  });
});
