import { describe, expect, it } from "vitest";
import { LocalParseLadder, extractPdfTextLayer } from "./local-parse-ladder";

/** Minimal text-layer PDF with "(Hello AMKP text layer) Tj" */
function buildTextPdf(phrase: string): Buffer {
  const stream = `BT /F1 12 Tf 100 700 Td (${phrase}) Tj ET`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += obj;
  }
  const xrefStart = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

describe("extractPdfTextLayer", () => {
  it("recovers text-layer strings without VLM", () => {
    const pdf = buildTextPdf("Hello AMKP text layer");
    expect(extractPdfTextLayer(pdf)).toContain("Hello AMKP text layer");
  });
});

describe("LocalParseLadder", () => {
  const ladder = new LocalParseLadder();

  it("tier1 completes text PDF with usedVlm=false", async () => {
    const pdf = buildTextPdf("Cheap tier parse works");
    const result = await ladder.extractTier1({
      filename: "doc.pdf",
      contentType: "application/pdf",
      content: pdf,
    });
    expect(result.usedVlm).toBe(false);
    expect(result.text).toContain("Cheap tier parse works");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("tier2 never sets usedVlm", async () => {
    const result = await ladder.extractTier2({
      filename: "empty.bin",
      contentType: "application/octet-stream",
      content: Buffer.from([0, 1, 2, 3]),
    });
    expect(result.usedVlm).toBe(false);
  });

  it("tier3 records VLM spend when invoked", async () => {
    const { createPageVisionLedger } = await import("./local-parse-ladder");
    const ledger = createPageVisionLedger();
    const withLedger = new LocalParseLadder(ledger);
    const result = await withLedger.extractTier3({
      filename: "scan.pdf",
      contentType: "application/pdf",
      content: Buffer.from("%PDF-1.4"),
    });
    expect(result.usedVlm).toBe(true);
    expect(result.spendUsd).toBeGreaterThan(0);
    expect(ledger.calls).toBe(1);
    expect(ledger.spendUsd).toBeGreaterThan(0);
  });
});
