import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { requestIdMiddleware } from "./common/request-id.middleware";
import { securityHeadersMiddleware } from "./common/security-headers.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const rawLimit = process.env.AMKP_BODY_LIMIT ?? "25mb";
  app.use(json({ limit: rawLimit }));
  app.use(requestIdMiddleware);
  app.use(securityHeadersMiddleware);
  app.useGlobalFilters(new ApiExceptionFilter());

  const origins = process.env.AMKP_CORS_ORIGINS?.trim();
  if (origins) {
    app.enableCors({
      origin: origins.split(",").map((o) => o.trim()).filter(Boolean),
      credentials: true,
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`AMKP api listening on :${port}`);
}

void bootstrap();
