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
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
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
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("api");
    expect(res.body.adapters).toMatchObject({
      vector: expect.any(String),
      retrieveCache: expect.any(String),
    });
  });

  it("GET /ready checks database", async () => {
    const res = await request(app.getHttpServer()).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, database: "up" });
  });

  it("GET /v1/tenants/:id returns settings for admin", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const aRes = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "GetTen Acct" });
    const tRes = await request(app.getHttpServer())
      .post(`/v1/accounts/${aRes.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "t1" });
    const got = await request(app.getHttpServer())
      .get(`/v1/tenants/${tRes.body.tenantId}`)
      .set(auth);
    expect(got.status).toBe(200);
    expect(got.body.tenantId).toBe(tRes.body.tenantId);
    expect(got.body.vectorNamespace).toMatch(/^ns_/);
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

    const missing = await request(app.getHttpServer())
      .get("/v1/accounts/acc_DOES_NOT_EXIST/tenants")
      .set(auth);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("ACCOUNT_NOT_FOUND");
  });

  it("resolves TenantContext from key, rejects override and revoked", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };

    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Key Account" });
    expect(account.status).toBe(201);

    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "keys" });
    expect(tenant.status).toBe(201);
    const tenantId = tenant.body.tenantId as string;
    const initialKey = tenant.body.apiKey as string;

    const me = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${initialKey}` });
    expect(me.status).toBe(200);
    expect(me.body).toEqual({
      tenantId,
      accountId: account.body.accountId,
    });

    const override = await request(app.getHttpServer())
      .post("/v1/me")
      .set({ Authorization: `Bearer ${initialKey}` })
      .send({ tenantId: "ten_OTHER" });
    expect(override.status).toBe(403);
    expect(override.body.error.code).toBe("TENANT_OVERRIDE_FORBIDDEN");

    const okBody = await request(app.getHttpServer())
      .post("/v1/me")
      .set({ Authorization: `Bearer ${initialKey}` })
      .send({});
    expect(okBody.status).toBe(200);

    const created = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/api-keys`)
      .set(auth);
    expect(created.status).toBe(201);
    expect(created.body.apiKey).toMatch(/^amkp_/);
    const apiKeyId = created.body.apiKeyId as string;
    const plaintext = created.body.apiKey as string;

    const list = await request(app.getHttpServer())
      .get(`/v1/tenants/${tenantId}/api-keys`)
      .set(auth);
    expect(list.status).toBe(200);
    expect(list.body.items.some((k: { apiKeyId: string }) => k.apiKeyId === apiKeyId)).toBe(
      true,
    );
    expect(list.body.items.every((k: { apiKey?: string }) => k.apiKey === undefined)).toBe(
      true,
    );

    const rotated = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/api-keys/${apiKeyId}/rotate`)
      .set(auth);
    expect(rotated.status).toBe(201);
    expect(rotated.body.revokedApiKeyId).toBe(apiKeyId);
    expect(rotated.body.apiKey).toMatch(/^amkp_/);

    const revokedUse = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${plaintext}` });
    expect(revokedUse.status).toBe(401);

    const newMe = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${rotated.body.apiKey}` });
    expect(newMe.status).toBe(200);
    expect(newMe.body.tenantId).toBe(tenantId);

    await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/api-keys/${rotated.body.apiKeyId}/revoke`)
      .set(auth);

    const afterRevoke = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${rotated.body.apiKey}` });
    expect(afterRevoke.status).toBe(401);
  });
});
