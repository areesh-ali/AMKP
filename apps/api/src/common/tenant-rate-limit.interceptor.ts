import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import type { RequestWithTenant } from "../tenancy/tenant-api-key.guard";
import {
  createTenantRateLimiterFromEnv,
  TenantRateLimiter,
} from "./tenant-rate-limiter";

export const sharedTenantRateLimiter = createTenantRateLimiterFromEnv();

@Injectable()
export class TenantRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly limiter: TenantRateLimiter = sharedTenantRateLimiter) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = req.tenantContext?.tenantId;
    if (tenantId && !this.limiter.allow(tenantId)) {
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
