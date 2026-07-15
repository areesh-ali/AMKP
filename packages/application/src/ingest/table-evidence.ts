import type { TableEvidence } from "@amkp/domain";

export interface ExtractedSegment {
  kind: "prose" | "table";
  text: string;
  table?: TableEvidence;
}

/**
 * Pull recoverable markdown / CSV tables from parsed text (FR-6).
 * Leaves surrounding prose as separate segments.
 */
export function segmentTextWithTables(raw: string): ExtractedSegment[] {
  const text = raw.replace(/\r\n/g, "\n");
  const segments: ExtractedSegment[] = [];

  const mdBlocks = extractMarkdownTables(text);
  if (mdBlocks.length > 0) {
    let cursor = 0;
    for (const block of mdBlocks) {
      const before = text.slice(cursor, block.start).trim();
      if (before) segments.push({ kind: "prose", text: before });
      segments.push({
        kind: "table",
        text: flattenTable(block.table),
        table: block.table,
      });
      cursor = block.end;
    }
    const after = text.slice(cursor).trim();
    if (after) segments.push({ kind: "prose", text: after });
    return segments;
  }

  const csv = tryParseCsvTable(text);
  if (csv) {
    return [{ kind: "table", text: flattenTable(csv), table: csv }];
  }

  const trimmed = text.trim();
  return trimmed ? [{ kind: "prose", text: trimmed }] : [];
}

function flattenTable(t: TableEvidence): string {
  const lines = [
    t.headers.join(" | "),
    ...t.rows.map((r) => r.join(" | ")),
  ];
  return lines.join("\n");
}

function extractMarkdownTables(
  text: string,
): Array<{ start: number; end: number; table: TableEvidence }> {
  const lines = text.split("\n");
  const out: Array<{ start: number; end: number; table: TableEvidence }> = [];
  let i = 0;
  let offset = 0;

  while (i < lines.length) {
    const headerLine = lines[i] ?? "";
    const sepLine = lines[i + 1] ?? "";
    if (isMdHeaderRow(headerLine) && isMdSeparator(sepLine)) {
      const start = offset;
      const headers = splitMdRow(headerLine);
      const rows: string[][] = [];
      let j = i + 2;
      let end = offset + headerLine.length + 1 + sepLine.length + 1;
      while (j < lines.length && isMdHeaderRow(lines[j] ?? "")) {
        rows.push(splitMdRow(lines[j] ?? ""));
        end += (lines[j] ?? "").length + 1;
        j += 1;
      }
      if (headers.length > 0 && rows.length > 0) {
        out.push({
          start,
          end: Math.min(end, text.length),
          table: { headers, rows },
        });
      }
      for (let k = i; k < j; k++) {
        offset += (lines[k] ?? "").length + 1;
      }
      i = j;
      continue;
    }
    offset += headerLine.length + 1;
    i += 1;
  }
  return out;
}

function isMdHeaderRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.includes("|");
}

function isMdSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|") || !t.endsWith("|")) return false;
  const cells = splitMdRow(t);
  return (
    cells.length > 0 &&
    cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, "")))
  );
}

function splitMdRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
}

function tryParseCsvTable(text: string): TableEvidence | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  if (!lines.every((l) => l.includes(","))) return null;
  const rows = lines.map((l) => l.split(",").map((c) => c.trim()));
  const width = rows[0]?.length ?? 0;
  if (width < 2) return null;
  if (!rows.every((r) => r.length === width)) return null;
  const headers = rows[0]!;
  const body = rows.slice(1);
  if (body.length === 0) return null;
  return { headers, rows: body };
}

/** Clamp parse confidence to SPEC range [0,1]. */
export function clampParseConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
