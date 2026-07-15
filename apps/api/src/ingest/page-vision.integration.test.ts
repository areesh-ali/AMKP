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
import {
  sharedPageVisionLedger,
  sharedVectorIndex,
} from "../infrastructure/persistence.module";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = "test-admin-token";

/** Scanned-deck stand-in: PDF header with no text operators. */
const SCANNED = Buffer.from(
  "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
);

describe("Page-vision opt-in (T-2.4)", () => {
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
    sharedPageVisionLedger.calls = 0;
    sharedPageVisionLedger.spendUsd = 0;
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

  async function provision() {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Vision Acct" });
    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });
    expect(tenant.body.pageVisionEnabled).toBe(false);
    return {
      auth,
      tenantId: tenant.body.tenantId as string,
      key: tenant.body.apiKey as string,
    };
  }

  it("scanned deck with pageVision disabled spends no VLM", async () => {
    const { tenantId, key } = await provision();
    const ingested = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        filename: "scanned-deck.pdf",
        contentType: "application/pdf",
        contentBase64: SCANNED.toString("base64"),
      });
    expect(ingested.status).toBe(202);

    const result = await processParse.execute({
      tenantId,
      documentId: ingested.body.documentId,
    });
    expect(result.usedVlm).toBe(false);
    expect(result.vlmSpendUsd).toBe(0);
    expect(sharedPageVisionLedger.calls).toBe(0);
    expect(result.parseTier).not.toBe("tier3_page_vision");
  });

  it("enabling pageVision allows tier3 escalation and VLM spend", async () => {
    const { auth, tenantId, key } = await provision();

    const updated = await request(app.getHttpServer())
      .patch(`/v1/tenants/${tenantId}`)
      .set(auth)
      .send({ pageVisionEnabled: true });
    expect(updated.status).toBe(200);
    expect(updated.body.pageVisionEnabled).toBe(true);

    const ingested = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${key}` })
      .send({
        filename: "scanned-deck.pdf",
        contentType: "application/pdf",
        contentBase64: SCANNED.toString("base64"),
      });
    expect(ingested.status).toBe(202);

    const result = await processParse.execute({
      tenantId,
      documentId: ingested.body.documentId,
    });
    expect(sharedPageVisionLedger.calls).toBe(1);
    expect(result.usedVlm).toBe(true);
    expect(result.vlmSpendUsd).toBeGreaterThan(0);
    expect(result.parseTier).toBe("tier3_page_vision");
  });
});
