import { AmkpApiError } from "@amkp/sdk-js";
import { describe, expect, it } from "vitest";
import { formatApiError } from "./errors";

describe("formatApiError", () => {
  it("formats AmkpApiError with requestId", () => {
    const err = new AmkpApiError(404, {}, "req_123");
    expect(formatApiError(err)).toBe("AMKP API 404 · req_123");
  });

  it("formats AmkpApiError without requestId", () => {
    const err = new AmkpApiError(500, {});
    expect(formatApiError(err)).toBe("AMKP API 500");
  });

  it("formats plain Error", () => {
    expect(formatApiError(new Error("boom"))).toBe("boom");
  });

  it("falls back for unknown", () => {
    expect(formatApiError(null)).toBe("Request failed");
  });
});
