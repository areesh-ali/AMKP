import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { createPrismaClient } from "@amkp/adapters-postgres";
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
    objectStorage: process.env.AMKP_OBJECT_STORAGE_DIR
      ? "local_fs"
      : "postgres_bytea",
    apiKeyHash: process.env.AMKP_API_KEY_PEPPER?.trim()
      ? "hmac-sha256"
      : "sha256",
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
      return { ok: true, service: "api", database: "up" };
    } catch {
      throw new ServiceUnavailableException({
        error: {
          code: "NOT_READY",
          message: "database unavailable",
          request_id: "ready",
        },
      });
    }
  }
}
