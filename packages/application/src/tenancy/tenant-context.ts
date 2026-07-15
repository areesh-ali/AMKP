import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantContext } from "./types";

const storage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error("TenantContext is required but was not resolved from auth");
  }
  return ctx;
}
