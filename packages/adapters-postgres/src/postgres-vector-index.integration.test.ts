import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient, PostgresVectorIndex } from "./index";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://amkp:amkp@localhost:5433/amkp";

describe("PostgresVectorIndex", () => {
  const prisma = createPrismaClient(databaseUrl);
  const index = new PostgresVectorIndex(prisma);

  beforeAll(async () => {
    await prisma.$connect();
    await index.clear();
  });

  afterAll(async () => {
    await index.clear();
    await prisma.$disconnect();
  });

  it("upserts and retrieves within a namespace only", async () => {
    await index.upsert({
      id: "chk_pg_a",
      tenantId: "ten_a",
      namespace: "ns_ten_a",
      documentId: "doc_a",
      documentVersionId: "doc_a_v1",
      content: "refund policy for enterprise customers",
      parseConfidence: 0.9,
      parseTier: "tier1_text",
    });
    await index.upsert({
      id: "chk_pg_b",
      tenantId: "ten_b",
      namespace: "ns_ten_b",
      documentId: "doc_b",
      documentVersionId: "doc_b_v1",
      content: "refund policy for enterprise customers",
      parseConfidence: 0.9,
      parseTier: "tier1_text",
    });

    const hitsA = await index.search({
      namespace: "ns_ten_a",
      query: "refund policy",
      limit: 5,
    });
    expect(hitsA.map((h) => h.id)).toEqual(["chk_pg_a"]);
    expect(hitsA[0]?.score).toBeGreaterThan(0);

    const hitsB = await index.search({
      namespace: "ns_ten_b",
      query: "refund policy",
      limit: 5,
    });
    expect(hitsB.map((h) => h.id)).toEqual(["chk_pg_b"]);
  });
});
