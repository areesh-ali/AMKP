import type { NextFunction, Request, Response } from "express";

/**
 * Structured access log (one JSON line per request).
 * Enable with AMKP_ACCESS_LOG=1.
 */
export function accessLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.AMKP_ACCESS_LOG !== "1") {
    next();
    return;
  }

  const started = Date.now();
  res.on("finish", () => {
    const requestId =
      (req as Request & { requestId?: string }).requestId ??
      (typeof req.headers["x-request-id"] === "string"
        ? req.headers["x-request-id"]
        : undefined);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        msg: "access",
        method: req.method,
        path: req.originalUrl?.split("?")[0] ?? req.url,
        status: res.statusCode,
        duration_ms: Date.now() - started,
        request_id: requestId,
      }),
    );
  });
  next();
}
