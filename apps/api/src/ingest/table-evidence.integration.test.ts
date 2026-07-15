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

const GOLD = `| Metric | Value |
| --- | --- |
| Precision | 0.91 |
| Recall | 0.87 |
`;

describe("TableEvidence API gold fixture (T-2.3)", () => {
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

  it("ingest → parse → retrieve returns TableEvidence + parseConfidence", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Table Acct" });
    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    const key = tenant.body.apiKey as string;

    const ingested = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        filename: "metrics.md",
        contentType: "text/markdown",
        contentBase64: Buffer.from(GOLD).toString("base64"),
      });
    expect(ingested.status).toBe(202);

    const parsed = await processParse.execute({
      tenantId: tenant.body.tenantId,
      documentId: ingested.body.documentId,
    });
    expect(parsed.tableChunkCount).toBeGreaterThan(0);

    const chunks = await request(app.getHttpServer())
      .get(`/v1/documents/${ingested.body.documentId}/chunks`)
      .set({ Authorization: `Bearer ${key}` });
    expect(chunks.status).toBe(200);
    const tableChunk = chunks.body.items.find(
      (i: { table?: unknown }) => i.table,
    );
    expect(tableChunk?.table?.headers).toEqual(["Metric", "Value"]);
    expect(tableChunk?.parseConfidence).toBeGreaterThanOrEqual(0);
    expect(tableChunk?.parseConfidence).toBeLessThanOrEqual(1);

    const retrieve = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${key}` })
      .send({ query: "Precision" });
    expect(retrieve.status).toBe(200);
    expect(retrieve.body.outcome.kind).toBe("evidence");
    const hit = retrieve.body.outcome.items.find(
      (i: { table?: unknown }) => i.table,
    );
    expect(hit?.table?.rows?.[0]).toEqual(["Precision", "0.91"]);
    expect(hit?.parseConfidence).toBeGreaterThanOrEqual(0);
    expect(hit?.parseConfidence).toBeLessThanOrEqual(1);
  });
});
