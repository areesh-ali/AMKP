/**
 * T-1.3 Auth isolation CI suite.
 * Fail CI on override-reject or revoke regressions (FR-2 / FR-3).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../app.module";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import {
  createPrismaClient,
  type PrismaClient,
} from "@amkp/adapters-postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

describe("Auth paths CI (T-1.3)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let tenantKey: string;
  let tenantId: string;
  let otherTenantId: string;

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

    const admin = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(admin)
      .send({ name: "CI Auth Account" });
    expect(account.status).toBe(201);

    const t1 = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(admin)
      .send({ name: "alpha" });
    expect(t1.status).toBe(201);
    tenantId = t1.body.tenantId;
    tenantKey = t1.body.apiKey;

    const t2 = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(admin)
      .send({ name: "beta" });
    expect(t2.status).toBe(201);
    otherTenantId = t2.body.tenantId;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("derives TenantContext from Bearer key only", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${tenantKey}` });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(tenantId);
    expect(res.body.tenantId).not.toBe(otherTenantId);
  });

  it("rejects body tenant override with 403", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/me")
      .set({ Authorization: `Bearer ${tenantKey}` })
      .send({ tenantId: otherTenantId });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("TENANT_OVERRIDE_FORBIDDEN");
    expect(res.body.error.request_id).toBeTruthy();
  });

  it("rejects tenant_id snake_case override with 403", async () => {
    const res = await request(app.getHttpServer())
      .post("/v1/me")
      .set({ Authorization: `Bearer ${tenantKey}` })
      .send({ tenant_id: otherTenantId });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("TENANT_OVERRIDE_FORBIDDEN");
  });

  it("returns 401 for revoked key on subsequent calls", async () => {
    const admin = { Authorization: `Bearer ${ADMIN}` };
    const created = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/api-keys`)
      .set(admin);
    expect(created.status).toBe(201);

    const before = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${created.body.apiKey}` });
    expect(before.status).toBe(200);

    const revoked = await request(app.getHttpServer())
      .post(`/v1/tenants/${tenantId}/api-keys/${created.body.apiKeyId}/revoke`)
      .set(admin);
    expect(revoked.status).toBe(200);

    const after = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${created.body.apiKey}` });
    expect(after.status).toBe(401);
    expect(after.body.error.code).toMatch(/API_KEY_REVOKED|UNAUTHORIZED/);
  });

  it("returns 401 for invalid Bearer key", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: "Bearer amkp_not_a_real_key" });
    expect(res.status).toBe(401);
  });

  it("key for tenant A cannot resolve as tenant B", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set({ Authorization: `Bearer ${tenantKey}` });
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe(tenantId);
    expect(res.body.tenantId).not.toBe(otherTenantId);
  });
});
