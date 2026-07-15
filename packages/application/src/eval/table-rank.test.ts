import { describe, expect, it } from "vitest";
import {
  compareTableRankAblation,
  tableRankScore,
} from "./table-rank";

describe("TableRank ablation (T-7.2)", () => {
  it("scores table cell/header matches", () => {
    const score = tableRankScore("revenue q1", [
      {
        headers: ["Quarter", "Revenue"],
        rows: [
          ["Q1", "100"],
          ["Q2", "120"],
        ],
      },
    ]);
    expect(score).toBeGreaterThan(0);
  });

  it("reports multimodal vs text-only TableRank", () => {
    const report = compareTableRankAblation({
      query: "revenue q1",
      multimodalItems: [
        {
          id: "ev_1",
          score: 0.9,
          citation: { documentId: "doc_1" },
          content: "see table",
          table: {
            headers: ["Quarter", "Revenue"],
            rows: [["Q1", "100"]],
          },
        },
      ],
    });
    expect(report.multimodal.tableRank).toBeGreaterThan(
      report.textOnly.tableRank,
    );
    expect(report.textOnly.tableEvidenceCount).toBe(0);
    expect(report.lift).toBeGreaterThan(0);
  });
});
