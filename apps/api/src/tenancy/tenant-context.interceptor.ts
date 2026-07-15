import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, defer } from "rxjs";
import { runWithTenantContext } from "@amkp/application";
import type { RequestWithTenant } from "./tenant-api-key.guard";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const ctx = req.tenantContext;
    if (!ctx) {
      return next.handle();
    }
    return defer(() => runWithTenantContext(ctx, () => next.handle()));
  }
}
