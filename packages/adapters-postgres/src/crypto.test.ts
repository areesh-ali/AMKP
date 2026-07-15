import { afterEach, describe, expect, it } from "vitest";
import { hashApiKey } from "./crypto";

describe("hashApiKey", () => {
  const prev = process.env.AMKP_API_KEY_PEPPER;

  afterEach(() => {
    if (prev === undefined) delete process.env.AMKP_API_KEY_PEPPER;
    else process.env.AMKP_API_KEY_PEPPER = prev;
  });

  it("is deterministic without pepper", () => {
    delete process.env.AMKP_API_KEY_PEPPER;
    expect(hashApiKey("amkp_test")).toBe(hashApiKey("amkp_test"));
    expect(hashApiKey("amkp_test")).toHaveLength(64);
  });

  it("changes when pepper is set", () => {
    delete process.env.AMKP_API_KEY_PEPPER;
    const plain = hashApiKey("amkp_test");
    process.env.AMKP_API_KEY_PEPPER = "dev-pepper";
    const peppered = hashApiKey("amkp_test");
    expect(peppered).not.toBe(plain);
    expect(peppered).toBe(hashApiKey("amkp_test"));
  });
});
