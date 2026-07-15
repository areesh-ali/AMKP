import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantContext } from "./types";
import { MissingTenantContextError } from "./ports";

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
    throw new MissingTenantContextError();
  }
  return ctx;
}
