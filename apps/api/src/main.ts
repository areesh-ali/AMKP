import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import { startAmkpOtel } from "@amkp/adapters-providers";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { accessLogMiddleware } from "./common/access-log.middleware";
import { requestIdMiddleware } from "./common/request-id.middleware";
import { securityHeadersMiddleware } from "./common/security-headers.middleware";
import { requestTimeoutMiddleware } from "./common/request-timeout.middleware";

async function bootstrap() {
  const shutdownOtel = await startAmkpOtel({ serviceName: "amkp-api" });

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const rawLimit = process.env.AMKP_BODY_LIMIT ?? "25mb";
  app.use(json({ limit: rawLimit }));
  app.use(requestIdMiddleware);
  app.use(accessLogMiddleware);
  app.use(requestTimeoutMiddleware);
  app.use(securityHeadersMiddleware);
  app.useGlobalFilters(new ApiExceptionFilter());

  const origins = process.env.AMKP_CORS_ORIGINS?.trim();
  if (origins) {
    app.enableCors({
      origin: origins.split(",").map((o) => o.trim()).filter(Boolean),
      credentials: true,
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "x-request-id",
      ],
      exposedHeaders: [
        "Idempotent-Replayed",
        "x-request-id",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After",
      ],
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`AMKP api listening on :${port}`);

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`AMKP api shutting down (${signal})`);
    await app.close();
    await shutdownOtel();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();
