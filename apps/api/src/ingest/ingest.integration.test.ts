import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import { sharedMemoryJobQueue } from "../infrastructure/persistence.module";
import {
  createPrismaClient,
  type PrismaClient,
} from "@amkp/adapters-postgres";
import { ProcessIngestJobUseCase } from "@amkp/application";
import { PrismaDocumentRepository } from "@amkp/adapters-postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = "test-admin-token";

describe("Ingest API (T-2.1)", () => {
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
    sharedMemoryJobQueue.jobs.length = 0;
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

  async function twoTenants() {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const a = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Acct Ingest A" });
    const b = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Acct Ingest B" });
    const tA = await request(app.getHttpServer())
      .post(`/v1/accounts/${a.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "support" });
    const tB = await request(app.getHttpServer())
      .post(`/v1/accounts/${b.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    return {
      keyA: tA.body.apiKey as string,
      keyB: tB.body.apiKey as string,
      tenantA: tA.body.tenantId as string,
      tenantB: tB.body.tenantId as string,
    };
  }

  it("POST /v1/ingest returns documentId + jobId and enqueues ingest", async () => {
    const { keyA } = await twoTenants();
    const contentBase64 = Buffer.from("hello knowledge plane").toString(
      "base64",
    );

    const res = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({
        filename: "hello.txt",
        contentType: "text/plain",
        contentBase64,
      });

    expect(res.status).toBe(202);
    expect(res.body.documentId).toMatch(/^doc_/);
    expect(res.body.jobId).toMatch(/^job_/);
    expect(sharedMemoryJobQueue.jobs).toHaveLength(1);
    expect(sharedMemoryJobQueue.jobs[0].queue).toBe("ingest");
    expect(sharedMemoryJobQueue.jobs[0].payload.documentId).toBe(
      res.body.documentId,
    );
  });

  it("documents are not listable across tenants", async () => {
    const { keyA, keyB } = await twoTenants();
    const contentBase64 = Buffer.from("secret-a").toString("base64");

    const created = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({
        filename: "secret.txt",
        contentBase64,
      });
    expect(created.status).toBe(202);

    const listB = await request(app.getHttpServer())
      .get("/v1/documents")
      .set({ Authorization: `Bearer ${keyB}` });
    expect(listB.status).toBe(200);
    expect(listB.body.items).toHaveLength(0);

    const listA = await request(app.getHttpServer())
      .get("/v1/documents")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(listA.status).toBe(200);
    expect(listA.body.items).toHaveLength(1);
    expect(listA.body.items[0].documentId).toBe(created.body.documentId);

    const leak = await request(app.getHttpServer())
      .get(`/v1/documents/${created.body.documentId}`)
      .set({ Authorization: `Bearer ${keyB}` });
    expect(leak.status).toBe(404);
    expect(leak.body.error.code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("worker ProcessIngestJobUseCase enqueues parse queue", async () => {
    const { keyA, tenantA } = await twoTenants();
    const created = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({
        filename: "pipe.txt",
        contentBase64: Buffer.from("pipe").toString("base64"),
      });
    expect(created.status).toBe(202);

    const docs = new PrismaDocumentRepository(prisma);
    const uc = new ProcessIngestJobUseCase(docs, sharedMemoryJobQueue);
    const result = await uc.execute({
      tenantId: tenantA,
      documentId: created.body.documentId,
    });

    expect(result.parseJobId).toBeTruthy();
    const queues = sharedMemoryJobQueue.jobs.map((j) => j.queue);
    expect(queues).toContain("ingest");
    expect(queues).toContain("parse");

    const row = await prisma.document.findUnique({
      where: { id: created.body.documentId },
    });
    expect(row?.status).toBe("parse_queued");
  });
});
