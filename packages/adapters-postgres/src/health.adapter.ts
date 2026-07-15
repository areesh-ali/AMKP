import type { HealthPort } from "@amkp/application";
import type { PrismaClient } from "./prisma";

/** Postgres health — SELECT 1 when a client is provided. */
export class PostgresHealthAdapter implements HealthPort {
  constructor(private readonly prisma?: PrismaClient) {}

  async check() {
    if (!this.prisma) {
      return { ok: true, service: "postgres-adapter-stub" };
    }
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, service: "postgres" };
  }
}
