import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { Observable } from "rxjs";
import type { RequestWithTenant } from "../tenancy/tenant-api-key.guard";
import {
  createTenantRateLimiterFromEnv,
  TenantRateLimiter,
} from "./tenant-rate-limiter";

export const sharedTenantRateLimiter = createTenantRateLimiterFromEnv();

function applyRateLimitHeaders(
  res: Response,
  decision: { limit: number; remaining: number; resetAt: number },
): void {
  if (decision.limit <= 0) return;
  res.setHeader("X-RateLimit-Limit", String(decision.limit));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, decision.remaining)),
  );
  res.setHeader(
    "X-RateLimit-Reset",
    String(Math.ceil(decision.resetAt / 1000)),
  );
}

@Injectable()
export class TenantRateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly limiter: TenantRateLimiter = sharedTenantRateLimiter,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const res = context.switchToHttp().getResponse<Response>();
    const tenantId = req.tenantContext?.tenantId;
    if (!tenantId) {
      return next.handle();
    }

    const decision = this.limiter.take(tenantId);
    applyRateLimitHeaders(res, decision);

    if (!decision.allowed) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((decision.resetAt - Date.now()) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSec));
      throw new HttpException(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Tenant rate limit exceeded",
            request_id: `rl_${Date.now()}`,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
