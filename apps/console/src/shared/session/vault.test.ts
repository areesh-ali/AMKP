import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, readSession, writeSession } from "./vault";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
});

afterEach(() => {
  clearSession();
});

describe("console session vault (C-1.2)", () => {
  it("round-trips a valid session", () => {
    writeSession({
      role: "operator",
      credential: "amkp_test",
      activeTenantId: "support",
    });
    expect(readSession()).toEqual({
      role: "operator",
      credential: "amkp_test",
      activeTenantId: "support",
    });
  });

  it("rejects empty credential", () => {
    sessionStorage.setItem(
      "amkp.console.session.v1",
      JSON.stringify({
        role: "admin",
        credential: "",
        activeTenantId: null,
      }),
    );
    expect(readSession()).toBeNull();
  });

  it("clearSession removes vault", () => {
    writeSession({
      role: "admin",
      credential: "tok",
      activeTenantId: null,
    });
    clearSession();
    expect(readSession()).toBeNull();
  });
});
