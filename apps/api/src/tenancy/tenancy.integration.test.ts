import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import {
  createPrismaClient,
  hashApiKey,
  type PrismaClient,
} from "@amkp/adapters-postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5432/amkp";
const ADMIN = "test-admin-token";

describe("Tenancy API (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.PLATFORM_ADMIN_TOKEN = ADMIN;

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
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("GET /health returns ok", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: "api" });
  });

  it("rejects missing admin token with 401 error shape", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/accounts")
      .send({ name: "Nope" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
      request_id: expect.any(String),
    });
  });

  it("creates accounts/tenants, scopes list, hashes api key", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };

    const aRes = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Account A" });
    expect(aRes.status).toBe(201);
    expect(aRes.body.accountId).toMatch(/^acc_/);

    const bRes = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Account B" });
    expect(bRes.status).toBe(201);

    const tA = await request(app.getHttpServer())
      .post(`/v1/accounts/${aRes.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "support" });
    expect(tA.status).toBe(201);
    expect(tA.body.tenantId).toMatch(/^ten_/);
    expect(tA.body.agenticEnabled).toBe(false);
    expect(tA.body.apiKey).toMatch(/^amkp_/);

    const tB = await request(app.getHttpServer())
      .post(`/v1/accounts/${bRes.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    expect(tB.status).toBe(201);

    const stored = await prisma.apiKey.findFirst({
      where: { tenantId: tA.body.tenantId },
    });
    expect(stored).toBeTruthy();
    expect(stored!.keyHash).toBe(hashApiKey(tA.body.apiKey));
    expect(stored!.keyHash).not.toBe(tA.body.apiKey);

    const listA = await request(app.getHttpServer())
      .get(`/v1/accounts/${aRes.body.accountId}/tenants`)
      .set(auth);
    expect(listA.status).toBe(200);
    expect(listA.body.items).toHaveLength(1);
    expect(listA.body.items[0].name).toBe("support");
    expect(listA.body.items[0].apiKey).toBeUndefined();
    expect(
      listA.body.items.every(
        (t: { accountId: string }) => t.accountId === aRes.body.accountId,
      ),
    ).toBe(true);

    const missing = await request(app.getHttpServer())
      .get("/v1/accounts/acc_DOES_NOT_EXIST/tenants")
      .set(auth);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });
});
