import type { EvidenceItem, TableEvidence } from "@amkp/domain";

/**
 * TableRank: fraction of table cells/headers matched by query terms (FR-22 / T-7.2).
 * Used for multimodal vs text-only ablation reports.
 */
export function tableRankScore(
  query: string,
  tables: TableEvidence[],
): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0 || tables.length === 0) return 0;

  let hits = 0;
  let total = 0;
  for (const table of tables) {
    const cells = [
      ...table.headers,
      ...table.rows.flatMap((r) => r),
    ].map((c) => c.toLowerCase());
    for (const term of terms) {
      total += 1;
      if (cells.some((c) => c.includes(term))) hits += 1;
    }
  }
  return total === 0 ? 0 : hits / total;
}

export function extractTables(items: EvidenceItem[]): TableEvidence[] {
  return items.map((i) => i.table).filter((t): t is TableEvidence => !!t);
}

export interface TableRankAblationReport {
  query: string;
  multimodal: {
    tableRank: number;
    evidenceCount: number;
    tableEvidenceCount: number;
  };
  textOnly: {
    tableRank: number;
    evidenceCount: number;
    /** Text-only path strips tables before scoring. */
    tableEvidenceCount: 0;
  };
  lift: number;
}

/**
 * Compare multimodal (tables kept) vs text-only (tables stripped) TableRank.
 */
export function compareTableRankAblation(input: {
  query: string;
  multimodalItems: EvidenceItem[];
}): TableRankAblationReport {
  const multiTables = extractTables(input.multimodalItems);
  const multimodalScore = tableRankScore(input.query, multiTables);
  const textOnlyItems = input.multimodalItems.map((i) => {
    const { table: _t, ...rest } = i;
    return rest;
  });
  const textOnlyScore = tableRankScore(
    input.query,
    extractTables(textOnlyItems),
  );

  return {
    query: input.query,
    multimodal: {
      tableRank: multimodalScore,
      evidenceCount: input.multimodalItems.length,
      tableEvidenceCount: multiTables.length,
    },
    textOnly: {
      tableRank: textOnlyScore,
      evidenceCount: textOnlyItems.length,
      tableEvidenceCount: 0,
    },
    lift: multimodalScore - textOnlyScore,
  };
}
