/**
 * T-5.2 — Tenant-keyed retrieve cache; no cross-Tenant cache hits.
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
  sharedVectorIndex,
} from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("Tenant-keyed retrieve cache (T-5.2)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let keyA: string;
  let keyB: string;
  let tenA: string;
  let tenB: string;

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
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();

    const auth = { Authorization: `Bearer ${ADMIN}` };
    const acc = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Cache Acct" });
    const tA = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "A" });
    const tB = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "B" });
    tenA = tA.body.tenantId;
    tenB = tB.body.tenantId;
    keyA = tA.body.apiKey;
    keyB = tB.body.apiKey;

    await sharedVectorIndex.upsert({
      id: "ev_a",
      tenantId: tenA,
      namespace: tenantVectorNamespace(tenA),
      documentId: "doc_a",
      content: "shared-query-text secret for tenant A only",
    });
    await sharedVectorIndex.upsert({
      id: "ev_b",
      tenantId: tenB,
      namespace: tenantVectorNamespace(tenB),
      documentId: "doc_b",
      content: "shared-query-text secret for tenant B only",
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("warmed Tenant A cache never serves A content to Tenant B", async () => {
    const q = { query: "shared-query-text" };

    const warm = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send(q);
    expect(warm.status).toBe(200);
    expect(warm.body.outcome.items[0].content).toContain("tenant A");
    expect(warm.body.costEstimate.estimatedUsd).toBeGreaterThan(0);

    const cachedA = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send(q);
    expect(cachedA.body.costEstimate.estimatedUsd).toBe(0);
    expect(cachedA.body.outcome.items[0].content).toContain("tenant A");

    const asB = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyB}` })
      .send(q);
    expect(asB.status).toBe(200);
    expect(asB.body.outcome.kind).toBe("evidence");
    expect(asB.body.outcome.items).toHaveLength(1);
    expect(asB.body.outcome.items[0].content).toContain("tenant B");
    expect(asB.body.outcome.items[0].content).not.toContain("tenant A");
    // B's first query is a live miss against A's cache
    expect(asB.body.costEstimate.estimatedUsd).toBeGreaterThan(0);
  });
});
