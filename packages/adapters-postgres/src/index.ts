import type { HealthPort } from "@amkp/application";

/** Postgres adapter stub — Prisma wiring lands in T-1.1 / T-5.1. */
export class PostgresHealthAdapter implements HealthPort {
  async check() {
    return { ok: true, service: "postgres-adapter-stub" };
  }
}
