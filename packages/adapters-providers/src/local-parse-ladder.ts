/**
 * Parse Ladder extractors.
 * Tiers 1–2: never VLM. Tier3: stub page-vision with recorded spend (T-2.4).
 * PDF: inflate FlateDecode streams when present, then extract Tj/TJ/'/" text.
 */
import { inflateSync } from "node:zlib";
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

/**
 * Cheap PDF text-layer extractor: inflate FlateDecode content streams when
 * possible, then pull literal / hex strings from Tj, TJ, ', and " operators.
 */
export function extractPdfTextLayer(buf: Buffer): string {
  const raw = buf.toString("latin1");
  const expanded = expandFlateStreams(buf, raw);
  const corpus = `${raw}\n${expanded}`;
  const parts: string[] = [];

  const operators =
    /\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")|\[(.*?)\]\s*TJ|<([0-9A-Fa-f\s]+)>\s*(?:Tj|'|")/gs;
  let m: RegExpExecArray | null;
  while ((m = operators.exec(corpus))) {
    if (m[0].startsWith("[")) {
      const inner = m[1] ?? "";
      const strs = /\((?:\\.|[^\\)])*\)|<([0-9A-Fa-f\s]+)>/g;
      let s: RegExpExecArray | null;
      while ((s = strs.exec(inner))) {
        if (s[1] !== undefined) parts.push(hexPdfString(s[1]));
        else parts.push(unescapePdfString(s[0]));
      }
      continue;
    }
    if (m[2] !== undefined) {
      parts.push(hexPdfString(m[2]));
      continue;
    }
    const lit = m[0].replace(/\s*(?:Tj|'|")$/, "");
    parts.push(unescapePdfString(lit));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function expandFlateStreams(buf: Buffer, latin1: string): string {
  const chunks: string[] = [];
  const re =
    /\/Filter\s*\/FlateDecode[\s\S]*?stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin1))) {
    const payload = m[1];
    if (!payload) continue;
    try {
      // Locate raw bytes in the original buffer for accurate inflate.
      const marker = "stream\n";
      const markerCr = "stream\r\n";
      const idxN = buf.indexOf(Buffer.from(marker, "latin1"), m.index);
      const idxC = buf.indexOf(Buffer.from(markerCr, "latin1"), m.index);
      let start = -1;
      let headerLen = 0;
      if (idxN >= 0 && (idxC < 0 || idxN <= idxC)) {
        start = idxN;
        headerLen = marker.length;
      } else if (idxC >= 0) {
        start = idxC;
        headerLen = markerCr.length;
      }
      if (start < 0) continue;
      const end = buf.indexOf(Buffer.from("endstream", "latin1"), start);
      if (end < 0) continue;
      let data = buf.subarray(start + headerLen, end);
      if (data.length > 0 && data[data.length - 1] === 0x0a) {
        data = data.subarray(0, data.length - 1);
      }
      if (data.length > 0 && data[data.length - 1] === 0x0d) {
        data = data.subarray(0, data.length - 1);
      }
      const inflated = inflateSync(data);
      chunks.push(inflated.toString("latin1"));
    } catch {
      // Not every FlateDecode stream is content; ignore inflate failures.
    }
  }
  return chunks.join("\n");
}

function hexPdfString(hex: string): string {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2 !== 0) return "";
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return Buffer.from(bytes).toString("latin1");
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
