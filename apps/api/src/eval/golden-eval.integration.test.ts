/**
 * T-7.1 — Golden-set eval API.
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

describe("Golden-set eval (T-7.1)", () => {
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
      .send({ name: "Eval Acct" });
    const t = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    key = t.body.apiKey;
    tenantId = t.body.tenantId;
    await sharedVectorIndex.upsert({
      id: "ev_1",
      tenantId,
      namespace: tenantVectorNamespace(tenantId),
      documentId: "doc_refund",
      content: "refund policy within 30 days",
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("POST /v1/eval/golden-set returns per-question outcomes + judge modelId", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/eval/golden-set")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        judge: { kind: "llm", modelId: "judge-v1" },
        questions: [
          {
            id: "q1",
            question: "refund",
            expectedDocumentIds: ["doc_refund"],
            expectedKeywords: ["30 days"],
          },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.judge.modelId).toBe("judge-v1");
    expect(res.body.outcomes).toHaveLength(1);
    expect(res.body.outcomes[0].passed).toBe(true);
    expect(res.body.summary.passed).toBe(1);
  });
});
