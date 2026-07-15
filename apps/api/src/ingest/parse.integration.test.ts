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

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";
const ADMIN = "test-admin-token";

function buildTextPdf(phrase: string): Buffer {
  const stream = `BT /F1 12 Tf 100 700 Td (${phrase}) Tj ET`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += obj;
  }
  const xrefStart = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

describe("Parse Ladder tiers 1–2 (T-2.2)", () => {
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

  it("text-layer PDF parses on tier1_text without VLM and records tier on chunks", async () => {
    const auth = { Authorization: `Bearer ${ADMIN}` };
    const account = await request(app.getHttpServer())
      .post("/v1/accounts")
      .set(auth)
      .send({ name: "Parse Acct" });
    const tenant = await request(app.getHttpServer())
      .post(`/v1/accounts/${account.body.accountId}/tenants`)
      .set(auth)
      .send({ name: "docs" });

    const phrase = "Hello AMKP text layer parse";
    const pdf = buildTextPdf(phrase);
    const ingested = await request(app.getHttpServer())
      .post("/v1/ingest")
      .set({ Authorization: `Bearer ${tenant.body.apiKey}` })
      .send({
        filename: "handbook.pdf",
        contentType: "application/pdf",
        contentBase64: pdf.toString("base64"),
      });
    expect(ingested.status).toBe(202);

    const result = await processParse.execute({
      tenantId: tenant.body.tenantId,
      documentId: ingested.body.documentId,
    });

    expect(result.usedVlm).toBe(false);
    expect(result.parseTier).toBe("tier1_text");
    expect(result.chunkCount).toBeGreaterThan(0);

    const chunks = await request(app.getHttpServer())
      .get(`/v1/documents/${ingested.body.documentId}/chunks`)
      .set({ Authorization: `Bearer ${tenant.body.apiKey}` });
    expect(chunks.status).toBe(200);
    expect(chunks.body.items.length).toBeGreaterThan(0);
    expect(chunks.body.items[0].parseTier).toBe("tier1_text");
    expect(chunks.body.items[0].content).toContain("Hello AMKP");

    const doc = await prisma.document.findUnique({
      where: { id: ingested.body.documentId },
    });
    expect(doc?.status).toBe("parsed");
  });
});
