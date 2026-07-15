import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { runWithTenantContext } from "@amkp/application";
import type { RequestWithTenant } from "./tenant-api-key.guard";

/**
 * Keep TenantContext ALS alive for the full Observable lifetime.
 * Subscribing inside `runWithTenantContext` is required — returning an
 * Observable from ALS.run lets the store exit before Nest subscribes.
 */
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

    return new Observable((subscriber) => {
      runWithTenantContext(ctx, () => {
        const sub = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
        subscriber.add(() => sub.unsubscribe());
      });
    });
  }
}
