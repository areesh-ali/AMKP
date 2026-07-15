#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(dir, "golden-questions.json"), "utf8"));
console.log(
  JSON.stringify(
    {
      pack: golden.pack,
      docs: "docs/poc-pack.md",
      passCriteria: [
        "Leak suite green (Retrieve/cache/MCP)",
        "Golden eval >= 80% passed",
        "TableRank avgLift > 0",
      ],
      endpoints: {
        goldenSet: "POST /v1/eval/golden-set",
        tableRank: "POST /v1/eval/table-rank",
      },
      questions: golden.questions.length,
      tableRankQueries: golden.tableRankQueries,
    },
    null,
    2,
  ),
);
