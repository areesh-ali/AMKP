/**
 * Parse Ladder extractors.
 * Tiers 1–2: never VLM. Tier3: stub page-vision with recorded spend (T-2.4).
 */
import type {
  PageVisionSpendLedger,
  ParseLadderPort,
  ParsedText,
} from "@amkp/application";

const TIER3_SPEND_USD = 0.02;

export class LocalParseLadder implements ParseLadderPort {
  constructor(private readonly ledger?: PageVisionSpendLedger) {}

  async extractTier1(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText> {
    const text = extractText(input);
    const confidence = scoreConfidence(text, input.content.length);
    return { text, confidence, usedVlm: false, spendUsd: 0 };
  }

  async extractTier2(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText> {
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
    return { text, confidence, usedVlm: false, spendUsd: 0 };
  }

  async extractTier3(input: {
    filename: string;
    contentType: string;
    content: Buffer;
  }): Promise<ParsedText> {
    if (this.ledger) {
      this.ledger.calls += 1;
      this.ledger.spendUsd += TIER3_SPEND_USD;
    }
    // Stub page-vision: fabricate OCR text from filename so tests can assert spend.
    const label = input.filename.replace(/\.[^.]+$/, "") || "scanned";
    const text = `page-vision ocr: ${label} recovered slide content`;
    return {
      text,
      confidence: 0.55,
      usedVlm: true,
      spendUsd: TIER3_SPEND_USD,
    };
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

  const asUtf8 = input.content.toString("utf8");
  const printable = asUtf8.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
  if (printable.trim().length >= 20) return printable;
  return "";
}

function isPdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

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
  const ratio = len / Math.max(byteSize, 1);
  const raw = 0.4 + ratio * 4 + Math.min(len, 200) / 400;
  return Math.min(1, Math.max(0.35, raw));
}

export function createPageVisionLedger(): PageVisionSpendLedger {
  return { calls: 0, spendUsd: 0 };
}
