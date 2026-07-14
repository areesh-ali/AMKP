import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const expected = process.env.PLATFORM_ADMIN_TOKEN;

    if (!expected) {
      throw new UnauthorizedException({
        error: {
          code: "ADMIN_TOKEN_NOT_CONFIGURED",
          message: "Platform admin token is not configured",
          request_id: requestIdFrom(req),
        },
      });
    }

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
          request_id: requestIdFrom(req),
        },
      });
    }

    const token = header.slice("Bearer ".length).trim();
    if (token !== expected) {
      throw new UnauthorizedException({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid platform admin token",
          request_id: requestIdFrom(req),
        },
      });
    }

    return true;
  }
}

function requestIdFrom(req: Request): string {
  const existing = req.headers["x-request-id"];
  if (typeof existing === "string" && existing.length > 0) return existing;
  return `req_${Date.now().toString(36)}`;
}
