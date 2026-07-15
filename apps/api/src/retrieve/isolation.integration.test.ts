/**
 * T-5.1 — namespace-per-Tenant + fail-closed retrieve.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  createPrismaClient,
  type PrismaClient,
} from "@amkp/adapters-postgres";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import { sharedVectorIndex } from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("Namespace isolation (T-5.1)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let keyA: string;
  let keyB: string;
  let tenA: string;
  let tenB: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.PLATFORM_ADMIN_TOKEN = ADMIN;
    sharedVectorIndex.clear();

    prisma = createPrismaClient(DATABASE_URL);
    await prisma.$connect();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    const admin = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(admin)
      .send({ name: "Isolation Account" });

    const a = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(admin)
      .send({ name: "tenant-a" });
    const b = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(admin)
      .send({ name: "tenant-b" });

    tenA = a.body.tenantId;
    tenB = b.body.tenantId;
    keyA = a.body.apiKey;
    keyB = b.body.apiKey;

    await sharedVectorIndex.upsert({
      id: "ev_a1",
      tenantId: tenA,
      namespace: tenantVectorNamespace(tenA),
      documentId: "doc_a",
      content: "classified payload for tenant A only",
    });
    await sharedVectorIndex.upsert({
      id: "ev_b1",
      tenantId: tenB,
      namespace: tenantVectorNamespace(tenB),
      documentId: "doc_b",
      content: "classified payload for tenant B only",
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("stores dedicated vectorNamespace per Tenant", async () => {
    const rowA = await prisma.tenant.findUnique({ where: { id: tenA } });
    const rowB = await prisma.tenant.findUnique({ where: { id: tenB } });
    expect(rowA?.vectorNamespace).toBe(tenantVectorNamespace(tenA));
    expect(rowB?.vectorNamespace).toBe(tenantVectorNamespace(tenB));
    expect(rowA?.vectorNamespace).not.toBe(rowB?.vectorNamespace);
  });

  it("Tenant A retrieve never returns Tenant B content", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({ query: "classified payload" });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(tenA);
    expect(res.body.outcome.kind).toBe("evidence");
    const contents = res.body.outcome.items.map(
      (i: { content: string }) => i.content,
    );
    expect(contents.some((c: string) => c.includes("tenant A"))).toBe(true);
    expect(contents.some((c: string) => c.includes("tenant B"))).toBe(false);
  });

  it("Tenant B retrieve never returns Tenant A content", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .set({ Authorization: `Bearer ${keyB}` })
      .send({ query: "classified payload" });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(tenB);
    const contents = res.body.outcome.items.map(
      (i: { content: string }) => i.content,
    );
    expect(contents.some((c: string) => c.includes("tenant B"))).toBe(true);
    expect(contents.some((c: string) => c.includes("tenant A"))).toBe(false);
  });

  it("retrieve without auth fails closed (401)", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/retrieve")
      .send({ query: "anything" });
    expect(res.status).toBe(401);
  });
});
