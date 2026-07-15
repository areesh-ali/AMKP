import type { NextFunction, Request, Response } from "express";

/**
 * Soft request timeout (AMKP_REQUEST_TIMEOUT_MS, default 30s).
 * Does not abort in-flight work; responds 504 if still open when the timer fires.
 */
export function requestTimeoutMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ms = Number(process.env.AMKP_REQUEST_TIMEOUT_MS ?? "30000");
  if (!Number.isFinite(ms) || ms <= 0) {
    next();
    return;
  }
  const timer = setTimeout(() => {
    if (res.headersSent) return;
    res.status(504).json({
      error: {
        code: "REQUEST_TIMEOUT",
        message: `Request exceeded ${ms}ms`,
        request_id:
          (req as { requestId?: string }).requestId ??
          req.header("x-request-id") ??
          `timeout_${Date.now()}`,
      },
    });
  }, ms);
  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
}
