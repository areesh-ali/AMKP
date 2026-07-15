import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import type { IdempotencyStore, TenantContext } from "@amkp/application";
import type { RequestWithTenant } from "../tenancy/tenant-api-key.guard";
import { IDEMPOTENCY_STORE } from "../tenancy/tenancy.tokens";

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

function idempotencyTtlSeconds(): number {
  const raw = Number(process.env.AMKP_IDEMPOTENCY_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_TTL_SECONDS;
}

/**
 * Replay cached ingest responses for matching Idempotency-Key (tenant-scoped).
 * Sets response header `Idempotent-Replayed: true` on cache hits.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithTenant>();
    const res = http.getResponse<{ setHeader: (k: string, v: string) => void }>();
    const key = req.header("idempotency-key")?.trim();
    const ctx = req.tenantContext as TenantContext | undefined;
    if (!key || !ctx?.tenantId) {
      return next.handle();
    }

    return from(this.store.get(ctx.tenantId, key)).pipe(
      switchMap((cached) => {
        if (cached) {
          res.setHeader("Idempotent-Replayed", "true");
          try {
            return of(JSON.parse(cached) as unknown);
          } catch {
            return next.handle();
          }
        }
        return next.handle().pipe(
          tap((body) => {
            void this.store.set(
              ctx.tenantId,
              key,
              JSON.stringify(body),
              idempotencyTtlSeconds(),
            );
          }),
        );
      }),
    );
  }
}
