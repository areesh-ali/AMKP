import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPrismaClient,
  PrismaAuditLog,
  PrismaTraceRepository,
} from "./index";
import type { TraceRecord } from "@amkp/domain";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";

describe("PrismaTraceRepository + PrismaAuditLog", () => {
  const prisma = createPrismaClient(databaseUrl);
  const traces = new PrismaTraceRepository(prisma);
  const audit = new PrismaAuditLog(prisma);

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.auditEntry.deleteMany({});
    await prisma.trace.deleteMany({});
  });

  afterAll(async () => {
    await prisma.auditEntry.deleteMany({});
    await prisma.trace.deleteMany({});
    await prisma.$disconnect();
  });

  it("persists and loads a Trace by requestId", async () => {
    const record: TraceRecord = {
      requestId: "req_persist_1",
      tenantId: "ten_persist",
      createdAt: new Date().toISOString(),
      routerDecision: { mode: "single_pass", reasonCode: "default" },
      evidenceIds: ["ev_1"],
      outcomeKind: "evidence",
      costEstimate: { currency: "USD", estimatedUsd: 0.001 },
      steps: [],
    };
    await traces.save(record);
    const loaded = await traces.findByRequestId("req_persist_1");
    expect(loaded).toMatchObject({
      requestId: "req_persist_1",
      tenantId: "ten_persist",
      evidenceIds: ["ev_1"],
    });
  });

  it("appends audit entries", async () => {
    await audit.append({
      action: "agentic_override_enable",
      actor: "admin@example.com",
      tenantId: "ten_persist",
      detail: { reason: "test" },
    });
    const rows = await prisma.auditEntry.findMany({
      where: { tenantId: "ten_persist" },
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]?.action).toBe("agentic_override_enable");
  });
});
