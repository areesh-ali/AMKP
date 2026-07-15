import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId?: string };

/** Attach X-Request-Id (or generate) for error correlation. */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header("x-request-id")?.trim();
  const id = incoming && incoming.length > 0 ? incoming : `req_${randomUUID()}`;
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
