import type { TenantId } from "@amkp/domain";

/** Resolved only from auth middleware — never from client body (AD-2). */
export interface TenantContext {
  tenantId: TenantId;
  accountId: string;
}
