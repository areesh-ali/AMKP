import type { NextFunction, Request, Response } from "express";

/** Minimal security headers (no heavy helmet dependency). */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (process.env.AMKP_HSTS === "1") {
    const maxAge = Number(process.env.AMKP_HSTS_MAX_AGE ?? 31536000);
    res.setHeader(
      "Strict-Transport-Security",
      `max-age=${Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 31536000}; includeSubDomains`,
    );
  }
  next();
}
