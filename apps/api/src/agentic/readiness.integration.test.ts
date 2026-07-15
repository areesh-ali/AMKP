/**
 * T-4.2 — Agentic Readiness gate + audited override.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { tenantVectorNamespace } from "@amkp/domain";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import {
  createPrismaClient,
  type PrismaClient,
} from "@amkp/adapters-postgres";
import {
  sharedAuditLog,
  sharedRetrieveCache,
  sharedTraceRepository,
  sharedVectorIndex,
} from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("Agentic Readiness gate (T-4.2)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let key: string;
  let tenantId: string;
  const auth = { Authorization: `Bearer ${ADMIN}` };

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.PLATFORM_ADMIN_TOKEN = ADMIN;
    process.env.AMKP_JOB_QUEUE = "memory";
    process.env.NODE_ENV = "test";

    prisma = createPrismaClient(DATABASE_URL);
    await prisma.$connect();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }, 60_000);

  beforeEach(async () => {
    sharedVectorIndex.clear();
    sharedRetrieveCache.clear();
    sharedTraceRepository.clear();
    sharedAuditLog.clear();
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();

    const acc = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Ready Acct" });
    const t = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "new" });
    expect(t.body.agenticReadinessPassed).toBe(false);
    key = t.body.apiKey;
    tenantId = t.body.tenantId;

    await sharedVectorIndex.upsert({
      id: "ev_1",
      tenantId,
      namespace: tenantVectorNamespace(tenantId),
      documentId: "doc_1",
      content: "hello world",
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("mode=agentic without readiness returns 403", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "hello", mode: "agentic" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("AGENTIC_READINESS_REQUIRED");
  });

  it("audited override enables agentic and writes actor+timestamp", async () => {
    const denied = await request(app.getHttpServer())
      .patch(`/v1/tenants/${tenantId}`)
      .set(auth)
      .send({ agenticEnabled: true });
    expect(denied.status).toBe(400);

    const ok = await request(app.getHttpServer())
      .patch(`/v1/tenants/${tenantId}`)
      .set(auth)
      .send({
        agenticEnabled: true,
        agenticOverride: true,
        actor: "admin@example.com",
      });
    expect(ok.status).toBe(200);
    expect(ok.body.agenticEnabled).toBe(true);

    expect(sharedAuditLog.entries).toHaveLength(1);
    expect(sharedAuditLog.entries[0]?.action).toBe("agentic_override_enable");
    expect(sharedAuditLog.entries[0]?.actor).toBe("admin@example.com");
    expect(sharedAuditLog.entries[0]?.at).toBeTruthy();

    const audit = await request(app.getHttpServer())
      .get("/v1/audit")
      .set(auth);
    expect(audit.status).toBe(200);
    expect(audit.body.items[0]?.action).toBe("agentic_override_enable");

    const retrieve = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "hello", mode: "agentic" });
    expect(retrieve.status).toBe(200);
    expect(retrieve.body.routerDecision.mode).toBe("agentic");
  });
});
