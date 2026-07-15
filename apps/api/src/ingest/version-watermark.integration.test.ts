import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import {
  createPrismaClient,
  type PrismaClient,
} from "@amkp/adapters-postgres";
import { ProcessParseJobUseCase } from "@amkp/application";
import { PROCESS_PARSE_UC } from "../tenancy/tenancy.tokens";
import { sharedVectorIndex } from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = "test-admin-token";

describe("Document version watermark API (T-2.5)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let processParse: ProcessParseJobUseCase;

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
    processParse = moduleRef.get(PROCESS_PARSE_UC);
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

  it("re-ingest bumps version; retrieve prefers latest documentVersionId", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Ver Acct" });
    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    const key = tenant.body.apiKey as string;

    const v1 = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        filename: "policy.md",
        sourceKey: "policy",
        contentType: "text/markdown",
        contentBase64: Buffer.from("refund window is 30 days").toString(
          "base64",
        ),
      });
    expect(v1.status).toBe(202);
    expect(v1.body.version).toBe(1);

    await processParse.execute({
      tenantId: tenant.body.tenantId,
      documentId: v1.body.documentId,
    });

    const v2 = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        filename: "policy.md",
        sourceKey: "policy",
        contentType: "text/markdown",
        contentBase64: Buffer.from("refund window is 14 days").toString(
          "base64",
        ),
      });
    expect(v2.status).toBe(202);
    expect(v2.body.version).toBe(2);
    expect(v2.body.documentVersionId).toBe(v2.body.documentId);

    await processParse.execute({
      tenantId: tenant.body.tenantId,
      documentId: v2.body.documentId,
    });

    const retrieve = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "refund window" });
    expect(retrieve.status).toBe(200);
    expect(retrieve.body.outcome.kind).toBe("evidence");
    expect(retrieve.body.outcome.items).toHaveLength(1);
    expect(retrieve.body.outcome.items[0].content).toContain("14 days");
    expect(retrieve.body.outcome.items[0].documentVersionId).toBe(
      v2.body.documentId,
    );
  });
});
