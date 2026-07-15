import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  AccountNotFoundError,
  ApiKeyNotFoundError,
  ApiKeyRevokedError,
  TenantNotFoundError,
} from "@amkp/application";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = requestIdFrom(req);

    if (
      exception instanceof AccountNotFoundError ||
      exception instanceof TenantNotFoundError ||
      exception instanceof ApiKeyNotFoundError
    ) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (exception instanceof ApiKeyRevokedError) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "object"
      ) {
        res.status(status).json(body);
        return;
      }
      const message =
        typeof body === "string"
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);
      res.status(status).json({
        error: {
          code: HttpStatus[status] ?? "ERROR",
          message: Array.isArray(message) ? message.join(", ") : message,
          request_id: requestId,
        },
      });
      return;
    }

    const message =
      exception instanceof Error ? exception.message : "Internal server error";
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message,
        request_id: requestId,
      },
    });
  }
}

function requestIdFrom(req: Request): string {
  const existing = req.headers["x-request-id"];
  if (typeof existing === "string" && existing.length > 0) return existing;
  return `req_${Date.now().toString(36)}`;
}
