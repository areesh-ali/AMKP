import { describe, expect, it } from "vitest";
import {
  embeddingToPgVectorLiteral,
  stubEmbedText,
  STUB_EMBEDDING_DIMS,
} from "@amkp/application";

describe("stubEmbedText", () => {
  it("is deterministic and unit-length", () => {
    const a = stubEmbedText("refund policy table");
    const b = stubEmbedText("refund policy table");
    expect(a).toEqual(b);
    expect(a).toHaveLength(STUB_EMBEDDING_DIMS);
    const norm = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("scores overlapping queries higher than unrelated", () => {
    const doc = stubEmbedText("quarterly revenue table with region totals");
    const related = stubEmbedText("revenue table region");
    const unrelated = stubEmbedText("completely different topic xyz");
    const cos = (x: number[], y: number[]) =>
      x.reduce((s, v, i) => s + v * y[i]!, 0);
    expect(cos(doc, related)).toBeGreaterThan(cos(doc, unrelated));
  });

  it("formats pgvector literal", () => {
    const lit = embeddingToPgVectorLiteral([0.1, -0.2]);
    expect(lit).toBe("[0.10000000,-0.20000000]");
  });
});
