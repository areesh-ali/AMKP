/**
 * T-5.3 MCP Tenant binding + T-5.4 Leak Test suite (Retrieve / cache / MCP).
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
  sharedVectorIndex,
} from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = process.env.PLATFORM_ADMIN_TOKEN ?? "ci-admin-token";

/** Optional alert webhook for schedule/CI operators (T-5.4). */
async function alertOnLeak(detail: string): Promise<void> {
  const url = process.env.AMKP_LEAK_ALERT_WEBHOOK;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: `AMKP Leak Test FAILED: ${detail}`,
        source: "amkp-leak-suite",
      }),
    });
  } catch {
    // Alert delivery must not mask the assertion failure.
  }
}

function assertNoBContent(body: unknown, markerB: string) {
  const raw = JSON.stringify(body);
  expect(raw).not.toContain(markerB);
}

describe("MCP + Leak suite (T-5.3 / T-5.4)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let keyA: string;
  let keyB: string;
  let tenA: string;
  let tenB: string;
  let docA: string;
  let docB: string;
  const markerA = "LEAK_MARKER_TENANT_A_UNIQUE";
  const markerB = "LEAK_MARKER_TENANT_B_UNIQUE";

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
    await prisma.chunk.deleteMany();
    await prisma.document.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.account.deleteMany();

    const auth = { Authorization: `Bearer ${ADMIN}` };
    const acc = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Leak Acct" });
    const tA = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "A" });
    const tB = await request(app.getHttpServer())
      .post(`/v1/accounts/${acc.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "B" });
    tenA = tA.body.tenantId;
    tenB = tB.body.tenantId;
    keyA = tA.body.apiKey;
    keyB = tB.body.apiKey;
    docA = "doc_plant_a";
    docB = "doc_plant_b";

    await sharedVectorIndex.upsert({
      id: "ev_a",
      tenantId: tenA,
      namespace: tenantVectorNamespace(tenA),
      documentId: docA,
      content: `shared-query-text ${markerA}`,
    });
    await sharedVectorIndex.upsert({
      id: "ev_b",
      tenantId: tenB,
      namespace: tenantVectorNamespace(tenB),
      documentId: docB,
      content: `shared-query-text ${markerB}`,
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("MCP product tool manifest has no admin tools", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/mcp/tools")
      .set({ Authorization: `Bearer ${keyA}` });
    expect(res.status).toBe(200);
    expect(res.body.tools.map((t: { name: string }) => t.name)).toEqual([
      "retrieve",
    ]);
    expect(res.body.adminTools).toEqual([]);
  });

  it("MCP rejects tenant override and planted B Document IDs stay empty", async () => {
    const override = await request(app.getHttpServer())
      .post("/v1/mcp/tools/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({ query: "shared-query-text", tenantId: tenB });
    expect(override.status).toBe(403);

    const planted = await request(app.getHttpServer())
      .post("/v1/mcp/tools/retrieve")
      .set({ Authorization: `Bearer ${keyA}` })
      .send({ query: "shared-query-text", documentIds: [docB] });
    expect(planted.status).toBe(200);
    expect(planted.body.outcome.kind).toBe("evidence");
    expect(planted.body.outcome.items).toEqual([]);
    assertNoBContent(planted.body, markerB);
  });

  it("Leak suite: as A, zero B content across Retrieve, cache warm, and MCP", async () => {
    try {
      const q = { query: "shared-query-text" };

      const retrieve = await request(app.getHttpServer())
        .post("/v1/retrieve")
        .set({ Authorization: `Bearer ${keyA}` })
        .send(q);
      expect(retrieve.status).toBe(200);
      expect(retrieve.body.outcome.items[0].content).toContain(markerA);
      assertNoBContent(retrieve.body, markerB);

      const warm = await request(app.getHttpServer())
        .post("/v1/retrieve")
        .set({ Authorization: `Bearer ${keyA}` })
        .send(q);
      expect(warm.body.costEstimate.estimatedUsd).toBe(0);
      assertNoBContent(warm.body, markerB);

      const mcp = await request(app.getHttpServer())
        .post("/v1/mcp/tools/retrieve")
        .set({ Authorization: `Bearer ${keyA}` })
        .send(q);
      expect(mcp.status).toBe(200);
      expect(mcp.body.outcome.items[0].content).toContain(markerA);
      assertNoBContent(mcp.body, markerB);

      // Sanity: B still sees only B
      const asB = await request(app.getHttpServer())
        .post("/v1/retrieve")
        .set({ Authorization: `Bearer ${keyB}` })
        .send(q);
      expect(asB.body.outcome.items[0].content).toContain(markerB);
      assertNoBContent(asB.body, markerA);
    } catch (err) {
      await alertOnLeak(err instanceof Error ? err.message : String(err));
      throw err;
    }
  });
});
