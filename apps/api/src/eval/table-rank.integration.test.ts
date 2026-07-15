/**
 * T-7.2 — TableRank multimodal vs text-only ablation.
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

describe("TableRank ablation (T-7.2)", () => {
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
      .send({ name: "TR Acct" });
    const t = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    key = t.body.apiKey;
    tenantId = t.body.tenantId;
    await sharedVectorIndex.upsert({
      id: "ev_tbl",
      tenantId,
      namespace: tenantVectorNamespace(tenantId),
      documentId: "doc_fin",
      content: "financial revenue table q1",
      table: {
        headers: ["Quarter", "Revenue"],
        rows: [
          ["Q1", "100"],
          ["Q2", "120"],
        ],
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("POST /v1/eval/table-rank reports multimodal and text-only scores", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/eval/table-rank")
      .set({ Authorization: `Bearer ${key}` })
      .send({ queries: ["revenue q1"] });
    expect(res.status).toBe(200);
    expect(res.body.fixturePack).toBe("multimodal_chart_table_v1");
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].multimodal.tableRank).toBeGreaterThan(
      res.body.results[0].textOnly.tableRank,
    );
    expect(res.body.summary.avgLift).toBeGreaterThan(0);
  });
});
