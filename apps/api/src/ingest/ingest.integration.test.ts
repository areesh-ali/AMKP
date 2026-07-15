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

  it("POST /v1/ingest/upload accepts multipart file", async () => {
    const { keyA } = await twoTenants();
    const res = await request(app.getHttpServer())
      .post("/v1/ingest/upload")
      .set({ Authorization: `Bearer ${keyA}` })
      .field("sourceKey", "handbook")
      .attach("file", Buffer.from("multipart knowledge"), "handbook.txt");

    expect(res.status).toBe(202);
    expect(res.body.documentId).toMatch(/^doc_/);
    expect(res.body.filename).toBe("handbook.txt");
    expect(res.body.sourceKey).toBe("handbook");
    expect(res.body.byteSize).toBe(Buffer.from("multipart knowledge").length);
  });

  it("GET /v1/documents/:id/content returns bytes for owner only", async () => {
    const { keyA, keyB } = await twoTenants();
    const created = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({
        filename: "blob.txt",
        contentType: "text/plain",
        contentBase64: Buffer.from("secret-bytes").toString("base64"),
      });
    expect(created.status).toBe(202);

    const ok = await request(app.getHttpServer())
      .get(`/v1/documents/${created.body.documentId}/content`)
      .set({ Authorization: `Bearer ${keyA}` });
    expect(ok.status).toBe(200);
    expect(ok.headers["content-type"]).toMatch(/text\/plain/);
    expect(ok.text).toBe("secret-bytes");

    const leak = await request(app.getHttpServer())
      .get(`/v1/documents/${created.body.documentId}/content`)
      .set({ Authorization: `Bearer ${keyB}` });
    expect(leak.status).toBe(404);
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

    const delB = await request(app.getHttpServer())
      .delete(`/v1/documents/${created.body.documentId}`)
      .set({ Authorization: `Bearer ${keyB}` });
    expect(delB.status).toBe(404);

    const delA = await request(app.getHttpServer())
      .delete(`/v1/documents/${created.body.documentId}`)
      .set({ Authorization: `Bearer ${keyA}` });
    expect(delA.status).toBe(200);
    expect(delA.body).toEqual({
      documentId: created.body.documentId,
      deleted: true,
    });

    const listAfter = await request(app.getHttpServer())
      .get("/v1/documents")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(listAfter.body.items).toHaveLength(0);
  });

  it("lists documents with DB cursor pagination", async () => {
    const { keyA } = await twoTenants();
    for (const name of ["d1.txt", "d2.txt", "d3.txt"]) {
      const res = await request(app.getHttpServer())
        .post("/v1/ingest")
        .set({ Authorization: `Bearer ${keyA}` })
        .send({
          filename: name,
          contentBase64: Buffer.from(name).toString("base64"),
        });
      expect(res.status).toBe(202);
    }

    const page1 = await request(app.getHttpServer())
      .get("/v1/documents?limit=2")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(page1.status).toBe(200);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.total).toBe(3);
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await request(app.getHttpServer())
      .get(`/v1/documents?limit=2&cursor=${encodeURIComponent(page1.body.nextCursor)}`)
      .set({ Authorization: `Bearer ${keyA}` });
    expect(page2.status).toBe(200);
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.nextCursor).toBeNull();
  });

  it("lists document versions by sourceKey", async () => {
    const { keyA } = await twoTenants();
    for (const content of ["v1", "v2"]) {
      const res = await request(app.getHttpServer())
        .post("/v1/ingest")
        .set({ Authorization: `Bearer ${keyA}` })
        .send({
          filename: "policy.md",
          sourceKey: "policy",
          contentBase64: Buffer.from(content).toString("base64"),
        });
      expect(res.status).toBe(202);
    }
    const versions = await request(app.getHttpServer())
      .get("/v1/documents/versions?sourceKey=policy")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(versions.status).toBe(200);
    expect(versions.body.sourceKey).toBe("policy");
    expect(versions.body.items).toHaveLength(2);
    expect(versions.body.items.map((i: { version: number }) => i.version)).toEqual([
      1, 2,
    ]);
  });

  it("filters document list by status", async () => {
    const { keyA } = await twoTenants();
    const created = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({
        filename: "pending.txt",
        contentBase64: Buffer.from("p").toString("base64"),
      });
    expect(created.status).toBe(202);
    const pending = await request(app.getHttpServer())
      .get("/v1/documents?status=pending")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(pending.status).toBe(200);
    expect(pending.body.items.some((i: { documentId: string }) => i.documentId === created.body.documentId)).toBe(true);
    const parsed = await request(app.getHttpServer())
      .get("/v1/documents?status=parsed")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(parsed.body.items.every((i: { status: string }) => i.status === "parsed")).toBe(true);
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

  it("replays ingest response for matching Idempotency-Key", async () => {
    const { keyA } = await twoTenants();
    const body = {
      filename: "idem.txt",
      contentBase64: Buffer.from("idem-payload").toString("base64"),
    };
    const first = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({
        Authorization: `Bearer ${keyA}`,
        "Idempotency-Key": "client-key-1",
      })
      .send(body);
    expect(first.status).toBe(202);
    expect(first.headers["idempotent-replayed"]).toBeUndefined();

    const second = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({
        Authorization: `Bearer ${keyA}`,
        "Idempotency-Key": "client-key-1",
      })
      .send(body);
    expect(second.status).toBe(202);
    expect(second.headers["idempotent-replayed"]).toBe("true");
    expect(second.body.documentId).toBe(first.body.documentId);
    expect(second.body.jobId).toBe(first.body.jobId);
  });
});
