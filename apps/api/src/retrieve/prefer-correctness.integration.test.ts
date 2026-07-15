/**
 * T-3.3 — PreferCorrectness + per-Tenant threshold.
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
import { sharedVectorIndex } from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("PreferCorrectness threshold (T-3.3)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;

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
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  async function provision() {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "PC Acct" });
    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    expect(tenant.body.preferCorrectnessThreshold).toBe(0.5);
    return {
      auth,
      tenantId: tenant.body.tenantId as string,
      apiKey: tenant.body.apiKey as string,
    };
  }

  it("low score with preferCorrectness returns insufficient_evidence", async () => {
    const { auth, tenantId, apiKey } = await provision();
    const ns = tenantVectorNamespace(tenantId);
    // Weak lexical overlap + long content → hybrid score below default 0.5
    await sharedVectorIndex.upsert({
      id: "ev_weak",
      tenantId,
      namespace: ns,
      documentId: "doc_1",
      content: `${"x".repeat(8000)} refund ${"y".repeat(8000)}`,
    });

    const weakQuery =
      "refund cancellation emergency policy window timeline";

    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${apiKey}` })
      .send({ query: weakQuery, preferCorrectness: true });

    expect(res.status).toBe(200);
    expect(res.body.outcome.kind).toBe("insufficient_evidence");
    expect(res.body.outcome.threshold).toBe(0.5);
    expect(res.body.outcome.reason).toBe("below_threshold");

    await request(app.getHttpServer())
      .patch(`/v1/tenants/${tenantId}`)
      .set(auth)
      .send({ preferCorrectnessThreshold: 0.05 })
      .expect(200);

    const ok = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${apiKey}` })
      .send({ query: weakQuery, preferCorrectness: true });

    expect(ok.status).toBe(200);
    expect(ok.body.outcome.kind).toBe("evidence");
    expect(ok.body.outcome.items[0].id).toBe("ev_weak");
  });
});
