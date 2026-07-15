/**
 * T-6.1 — Trace get API by request ID.
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

describe("Trace get API (T-6.1)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let keyA: string;
  let keyB: string;
  let tenA: string;

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
      .send({ name: "Trace Acct" });
    const tA = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "A" });
    const tB = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "B" });
    tenA = tA.body.tenantId;
    keyA = tA.body.apiKey;
    keyB = tB.body.apiKey;

    await sharedVectorIndex.upsert({
      id: "ev_1",
      tenantId: tenA,
      namespace: tenantVectorNamespace(tenA),
      documentId: "doc_1",
      content: "refund policy text",
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("GET Trace by requestId includes Tenant, router, Evidence IDs, CostEstimate", async () => {
    const retrieve = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({ query: "refund" });
    expect(retrieve.status).toBe(200);
    const requestId = retrieve.body.requestId as string;

    const trace = await request(app.getHttpServer())
      .get(`/v1/traces/${requestId}`)
      .set({ Authorization: `Bearer ${keyA}` });
    expect(trace.status).toBe(200);
    expect(trace.body.tenantId).toBe(tenA);
    expect(trace.body.requestId).toBe(requestId);
    expect(trace.body.routerDecision.mode).toBe("single_pass");
    expect(trace.body.evidenceIds).toEqual(["ev_1"]);
    expect(trace.body.costEstimate.currency).toBe("USD");
    expect(trace.body.createdAt).toBeTruthy();

    const denied = await request(app.getHttpServer())
      .get(`/v1/traces/${requestId}`)
      .set({ Authorization: `Bearer ${keyB}` });
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("TRACE_TENANT_DENIED");

    const missing = await request(app.getHttpServer())
      .get("/v1/traces/req_does_not_exist")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(missing.status).toBe(404);
  });
});
