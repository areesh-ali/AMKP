import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { createPrismaClient } from "@amkp/adapters-postgres";
import { pingRedis, redisRequiredForReady } from "@amkp/adapters-redis";
import { PRISMA } from "./tenancy/tenancy.tokens";

type Prisma = ReturnType<typeof createPrismaClient>;

function adapterSummary() {
  const ephemeral =
    process.env.AMKP_VECTOR_INDEX === "memory" ||
    process.env.NODE_ENV === "test" ||
    process.env.AMKP_JOB_QUEUE === "memory";
  return {
    vector: ephemeral ? "memory" : "postgres+pgvector",
    retrieveCache:
      ephemeral || !process.env.REDIS_URL ? "memory" : "redis",
    traces: ephemeral ? "memory" : "postgres",
    objectStorage: process.env.AMKP_S3_BUCKET
      ? "s3"
      : process.env.AMKP_OBJECT_STORAGE_DIR
        ? "local_fs"
        : "postgres_bytea",
    apiKeyHash: process.env.AMKP_API_KEY_PEPPER?.trim()
      ? "hmac-sha256"
      : "sha256",
    embeddings: process.env.AMKP_EMBEDDING_API_KEY?.trim()
      ? "openai_compatible"
      : "stub",
    pdfEngine:
      process.env.AMKP_PDF_ENGINE === "cheap" ? "cheap" : "unpdf",
    pageVision: process.env.AMKP_PAGE_VISION_URL?.trim()
      ? "http"
      : "stub",
    documentWebhook: process.env.AMKP_DOCUMENT_WEBHOOK_URL?.trim()
      ? process.env.AMKP_DOCUMENT_WEBHOOK_SECRET?.trim()
        ? "signed_http"
        : "http"
      : "off",
    otel:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
      process.env.AMKP_OTEL === "1"
        ? "otlp"
        : process.env.AMKP_TRACE_CONSOLE === "1"
          ? "console"
          : "noop",
  };
}

@Controller()
export class HealthController {
  constructor(@Inject(PRISMA) private readonly prisma: Prisma) {}

  @Get("health")
  health() {
    return {
      ok: true,
      service: "api",
      adapters: adapterSummary(),
    };
  }

  @Get("ready")
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        error: {
          code: "NOT_READY",
          message: "database unavailable",
          request_id: "ready",
        },
      });
    }

    const redisUrl = process.env.REDIS_URL?.trim();
    if (redisRequiredForReady() && redisUrl) {
      try {
        await pingRedis(redisUrl);
      } catch {
        throw new ServiceUnavailableException({
          error: {
            code: "NOT_READY",
            message: "redis unavailable",
            request_id: "ready",
          },
        });
      }
      return {
        ok: true,
        service: "api",
        database: "up",
        redis: "up",
      };
    }

    return {
      ok: true,
      service: "api",
      database: "up",
      redis: redisUrl ? "skipped" : "not_configured",
    };
  }
}
