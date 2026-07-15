/**
 * T-4.1 — Router default single-pass for new Tenants.
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
  sharedRetrieveCache,
  sharedTraceRepository,
  sharedVectorIndex,
} from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("Router default single-pass (T-4.1)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let key: string;
  let tenantId: string;

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
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();

    const auth = { Authorization: `Bearer ${ADMIN}` };
    const acc = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Router Acct" });
    const t = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "new" });
    expect(t.body.agenticEnabled).toBe(false);
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

  it("new Tenant retrieve is single-pass; Trace records reason code", async () => {
    const retrieve = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "hello" });
    expect(retrieve.status).toBe(200);
    expect(retrieve.body.routerDecision.mode).toBe("single_pass");
    expect(retrieve.body.routerDecision.reasonCode).toBe(
      "tenant_default_single_pass",
    );

    const trace = await request(app.getHttpServer())
      .get(`/v1/traces/${retrieve.body.requestId}`)
      .set({ Authorization: `Bearer ${key}` });
    expect(trace.status).toBe(200);
    expect(trace.body.routerDecision.mode).toBe("single_pass");
    expect(trace.body.routerDecision.reasonCode).toBe(
      "tenant_default_single_pass",
    );
  });

  it("mode=agentic without enable returns 403", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "hello", mode: "agentic" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("AGENTIC_NOT_ENABLED");
  });
});
