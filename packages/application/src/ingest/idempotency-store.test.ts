import { describe, expect, it } from "vitest";
import { InMemoryIdempotencyStore } from "./idempotency-store";

describe("InMemoryIdempotencyStore", () => {
  it("isolates tenants and returns stored body", async () => {
    const store = new InMemoryIdempotencyStore();
    await store.set("ten_a", "k1", '{"ok":true}', 60);
    expect(await store.get("ten_a", "k1")).toBe('{"ok":true}');
    expect(await store.get("ten_b", "k1")).toBeNull();
  });
});
