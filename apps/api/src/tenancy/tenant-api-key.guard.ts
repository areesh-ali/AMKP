import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import {
  ApiKeyInvalidError,
  ApiKeyRevokedError,
  type TenantContext,
  ResolveTenantContextUseCase,
} from "@amkp/application";
import { RESOLVE_TENANT_UC } from "./tenancy.tokens";

export type RequestWithTenant = Request & { tenantContext?: TenantContext };

@Injectable()
export class TenantApiKeyGuard implements CanActivate {
  constructor(
    @Inject(RESOLVE_TENANT_UC)
    private readonly resolveTenant: ResolveTenantContextUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const requestId = requestIdFrom(req);

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
          request_id: requestId,
        },
      });
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing API key",
          request_id: requestId,
        },
      });
    }

    try {
      const ctx = await this.resolveTenant.execute(token);
      assertNoTenantOverride(req.body, ctx.tenantId, requestId);
      req.tenantContext = ctx;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      if (err instanceof ApiKeyRevokedError || err instanceof ApiKeyInvalidError) {
        throw new UnauthorizedException({
          error: {
            code: err.code,
            message: err.message,
            request_id: requestId,
          },
        });
      }
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid API key",
          request_id: requestId,
        },
      });
    }
  }
}

/** Reject if any client-supplied tenant claim disagrees with auth. */
export function assertNoTenantOverride(
  body: unknown,
  authTenantId: string,
  requestId: string,
): void {
  if (!body || typeof body !== "object") return;
  const record = body as Record<string, unknown>;
  for (const key of ["tenantId", "tenant_id"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0 && value !== authTenantId) {
      throw new ForbiddenException({
        error: {
          code: "TENANT_OVERRIDE_FORBIDDEN",
          message:
            "Client-supplied tenantId does not match authenticated Tenant",
          request_id: requestId,
        },
      });
    }
  }
}

function requestIdFrom(req: Request): string {
  const existing = req.headers["x-request-id"];
  if (typeof existing === "string" && existing.length > 0) return existing;
  return `req_${Date.now().toString(36)}`;
}

/** Exported for PlatformAdminGuard timing-safe compare. */
export function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return timingSafeEqual(aBuf, aBuf) && false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
