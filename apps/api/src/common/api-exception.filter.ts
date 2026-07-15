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
  ApiKeyAlreadyRevokedError,
  ApiKeyInvalidError,
  ApiKeyNotFoundError,
  ApiKeyRevokedError,
  DocumentNotFoundError,
  MissingTenantContextError,
  TenantNotFoundError,
  TraceNotFoundError,
  TraceTenantMismatchError,
  AgenticNotEnabledError,
  AgenticReadinessRequiredError,
  ValidationError,
} from "@amkp/application";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = requestIdFrom(req);

    if (exception instanceof ValidationError) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (
      exception instanceof AccountNotFoundError ||
      exception instanceof TenantNotFoundError ||
      exception instanceof ApiKeyNotFoundError ||
      exception instanceof DocumentNotFoundError ||
      exception instanceof TraceNotFoundError
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

    if (
      exception instanceof MissingTenantContextError ||
      exception instanceof TraceTenantMismatchError ||
      exception instanceof AgenticNotEnabledError ||
      exception instanceof AgenticReadinessRequiredError
    ) {
      res.status(HttpStatus.FORBIDDEN).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (
      exception instanceof ApiKeyRevokedError ||
      exception instanceof ApiKeyInvalidError
    ) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        error: {
          code: exception.code,
          message: exception.message,
          request_id: requestId,
        },
      });
      return;
    }

    if (exception instanceof ApiKeyAlreadyRevokedError) {
      res.status(HttpStatus.CONFLICT).json({
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
          message: Array.isArray(message) ? message.join(", ") : String(message),
          request_id: requestId,
        },
      });
      return;
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
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
