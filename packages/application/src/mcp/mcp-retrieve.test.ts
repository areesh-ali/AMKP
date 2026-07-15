import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import { RetrieveUseCase, type IndexedChunk, type VectorIndexPort } from "../retrieve/retrieve";
import { MCP_PRODUCT_TOOL_MANIFEST, McpRetrieveUseCase } from "./mcp-retrieve";

class FakeIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[] = []) {}
  async upsert(chunk: IndexedChunk) {
    this.chunks.push(chunk);
  }
  async search(input: { namespace: string; query: string }) {
    const q = input.query.toLowerCase();
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .filter((c) => c.content.toLowerCase().includes(q))
      .map((c) => ({ ...c, score: c.score ?? 1 }));
  }
}

describe("MCP Tenant binding (T-5.3)", () => {
  it("product manifest exposes retrieve only — no admin tools", () => {
    expect(MCP_PRODUCT_TOOL_MANIFEST.tools.map((t) => t.name)).toEqual([
      "retrieve",
    ]);
    expect(MCP_PRODUCT_TOOL_MANIFEST.adminTools).toEqual([]);
  });

  it("planted cross-Tenant Document IDs return empty, never B content", async () => {
    const tenA = "ten_A";
    const tenB = "ten_B";
    const index = new FakeIndex([
      {
        id: "ev_a",
        tenantId: tenA,
        namespace: tenantVectorNamespace(tenA),
        documentId: "doc_a",
        content: "alpha secret for A",
      },
      {
        id: "ev_b",
        tenantId: tenB,
        namespace: tenantVectorNamespace(tenB),
        documentId: "doc_b",
        content: "alpha secret for B",
      },
    ]);
    const mcp = new McpRetrieveUseCase(new RetrieveUseCase(index));

    const asA = await mcp.execute(
      { tenantId: tenA, accountId: "acc_1" },
      { query: "alpha", documentIds: ["doc_b"] },
      { requestId: "mcp_1" },
    );

    expect(asA.outcome.kind).toBe("evidence");
    if (asA.outcome.kind === "evidence") {
      expect(asA.outcome.items).toEqual([]);
      expect(
        asA.outcome.items.every((i) => !i.content?.includes("for B")),
      ).toBe(true);
    }

    const own = await mcp.execute(
      { tenantId: tenA, accountId: "acc_1" },
      { query: "alpha", documentIds: ["doc_a"] },
      { requestId: "mcp_2" },
    );
    expect(own.outcome.kind).toBe("evidence");
    if (own.outcome.kind === "evidence") {
      expect(own.outcome.items).toHaveLength(1);
      expect(own.outcome.items[0]?.citation.documentId).toBe("doc_a");
    }
  });
});
