import type { HealthPort } from "@amkp/application";
import {
  createPrismaClient,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaClient,
  PrismaTenantRepository,
  hashApiKey,
} from "./client";

export {
  createPrismaClient,
  PrismaAccountRepository,
  PrismaApiKeyIssuer,
  PrismaApiKeyRepository,
  PrismaClient,
  PrismaTenantRepository,
  hashApiKey,
};

/** Postgres health — SELECT 1 when DATABASE_URL is available. */
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
