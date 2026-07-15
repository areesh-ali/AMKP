/**
 * Cheap + layout-aware extractors with zero VLM calls (T-2.2).
 * Text-layer PDFs: recover strings from PDF content operators.
 */
import type { ParseLadderPort, ParsedText } from "@amkp/application";

export class LocalParseLadder implements ParseLadderPort {
  async extractTier1(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText> {
    const text = extractText(input);
    const confidence = scoreConfidence(text, input.content.length);
    return { text, confidence, usedVlm: false };
  }

  async extractTier2(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText> {
    // Layout-aware: prefer page/paragraph segmentation of recovered text.
    // Still no VLM — page-vision is T-2.4.
    const raw = extractText(input);
    const layoutAware = raw
      .split(/\f|(?:\r?\n){2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n");
    const text = layoutAware.length >= raw.trim().length ? layoutAware : raw;
    const confidence = Math.min(
      1,
      scoreConfidence(text, input.content.length) + 0.05,
    );
    return { text, confidence, usedVlm: false };
  }
}

function extractText(input: {
  filename: string;
  contentType: string;
  content: Buffer;
}): string {
  const ct = (input.contentType || "").toLowerCase();
  const name = (input.filename || "").toLowerCase();

  if (
    ct.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv")
  ) {
    return input.content.toString("utf8");
  }

  if (ct.includes("pdf") || name.endsWith(".pdf") || isPdf(input.content)) {
    return extractPdfTextLayer(input.content);
  }

  // Fallback: try UTF-8 if mostly printable
  const asUtf8 = input.content.toString("utf8");
  const printable = asUtf8.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
  if (printable.trim().length >= 20) return printable;
  return "";
}

function isPdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

/**
 * Minimal text-layer extractor: pulls Tj / TJ string operands.
 * Sufficient for synthetic text PDFs in CI; not a full PDF engine.
 */
export function extractPdfTextLayer(buf: Buffer): string {
  const src = buf.toString("latin1");
  const parts: string[] = [];

  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tj.exec(src))) {
    parts.push(unescapePdfString(m[0].replace(/\s*Tj$/, "")));
  }

  const tjArray = /\[(.*?)\]\s*TJ/gs;
  while ((m = tjArray.exec(src))) {
    const inner = m[1];
    const strs = /\((?:\\.|[^\\)])*\)/g;
    let s: RegExpExecArray | null;
    while ((s = strs.exec(inner))) {
      parts.push(unescapePdfString(s[0]));
    }
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function unescapePdfString(token: string): string {
  let s = token;
  if (s.startsWith("(") && s.endsWith(")")) {
    s = s.slice(1, -1);
  }
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function scoreConfidence(text: string, byteSize: number): number {
  const len = text.trim().length;
  if (len === 0) return 0;
  if (byteSize <= 0) return Math.min(1, len / 100);
  // Text-layer PDFs often have text << file size; reward absolute yield.
  const ratio = len / Math.max(byteSize, 1);
  return Math.max(0.35, Math.min(1, 0.4 + ratio * 4 + Math.min(len, 200) / 400));
}
