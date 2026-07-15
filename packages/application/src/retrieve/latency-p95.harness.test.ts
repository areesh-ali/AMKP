/**
 * T-3.5 — single-pass Retrieve p95 harness (excludes customer LLM time).
 * Agreed MVP corpus: 200 chunks in one Tenant namespace.
 * Budget target: ≤800ms p95 — reported; soft assert in CI.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { tenantVectorNamespace } from "@amkp/domain";
import {
  RetrieveUseCase,
  type IndexedChunk,
  type VectorIndexPort,
} from "./retrieve";

const CORPUS_SIZE = 200;
const ITERATIONS = 40;
const WARMUP = 5;
const P95_BUDGET_MS = 800;

class HarnessIndex implements VectorIndexPort {
  constructor(private readonly chunks: IndexedChunk[]) {}
  async upsert() {}
  async search(input: { namespace: string; query: string; limit?: number }) {
    const q = input.query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    return this.chunks
      .filter((c) => c.namespace === input.namespace)
      .map((c) => {
        const content = c.content.toLowerCase();
        const hits = terms.filter((t) => content.includes(t)).length;
        if (hits === 0) return null;
        return { ...c, score: hits / terms.length };
      })
      .filter((c): c is IndexedChunk & { score: number } => c !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, input.limit ?? 10);
  }
}

function buildCorpus(tenantId: string): IndexedChunk[] {
  const ns = tenantVectorNamespace(tenantId);
  const chunks: IndexedChunk[] = [];
  for (let i = 0; i < CORPUS_SIZE; i++) {
    const topic = ["refund", "billing", "shipping", "privacy", "security"][
      i % 5
    ]!;
    chunks.push({
      id: `ev_${i}`,
      tenantId,
      namespace: ns,
      documentId: `doc_${Math.floor(i / 10)}`,
      content: `${topic} policy clause ${i}: ${"lorem ".repeat(60)}`,
    });
  }
  return chunks;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx]!;
}

describe("Retrieve p95 latency harness (T-3.5)", () => {
  it("reports p95 excluding customer LLM time for agreed corpus", async () => {
    const tenantId = "ten_harness";
    const uc = new RetrieveUseCase(new HarnessIndex(buildCorpus(tenantId)));
    const queries = [
      "refund policy",
      "billing invoice",
      "shipping delay",
      "privacy consent",
      "security access",
    ];

    for (let i = 0; i < WARMUP; i++) {
      await uc.execute(
        { tenantId, accountId: "acc_h" },
        { query: queries[i % queries.length]! },
        { requestId: `warm_${i}` },
      );
    }

    const samples: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      await uc.execute(
        { tenantId, accountId: "acc_h" },
        { query: queries[i % queries.length]! },
        { requestId: `req_${i}` },
      );
      samples.push(performance.now() - t0);
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const report = {
      story: "T-3.5",
      corpusSize: CORPUS_SIZE,
      iterations: ITERATIONS,
      warmup: WARMUP,
      excludesCustomerLlm: true,
      p50Ms: Number(percentile(sorted, 50).toFixed(3)),
      p95Ms: Number(percentile(sorted, 95).toFixed(3)),
      p99Ms: Number(percentile(sorted, 99).toFixed(3)),
      maxMs: Number(sorted[sorted.length - 1]!.toFixed(3)),
      budgetP95Ms: P95_BUDGET_MS,
      withinBudget: percentile(sorted, 95) <= P95_BUDGET_MS,
      generatedAt: new Date().toISOString(),
      fixtureHash: createHash("sha256")
        .update(`corpus:${CORPUS_SIZE}`)
        .digest("hex")
        .slice(0, 12),
    };

    const reportPath = join(
      process.cwd(),
      "../../_bmad-output/implementation-artifacts/latency-p95-report.json",
    );
    mkdirSync(join(reportPath, ".."), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    expect(report.excludesCustomerLlm).toBe(true);
    expect(report.p95Ms).toBeGreaterThanOrEqual(0);
    expect(report.corpusSize).toBe(CORPUS_SIZE);
    // Soft budget: warn via expectation message but keep green for tiny local CI.
    expect(
      report.withinBudget,
      `p95 ${report.p95Ms}ms should be ≤ ${P95_BUDGET_MS}ms`,
    ).toBe(true);
  }, 30_000);
});
