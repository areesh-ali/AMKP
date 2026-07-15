import type { Document } from "@amkp/domain";

export interface ListDocumentsOpts {
  /** Page size (default 50, max 500). */
  limit?: number;
  /** Legacy offset pagination (ignored when cursor is set). */
  offset?: number;
  /** Opaque cursor from a previous page's nextCursor. */
  cursor?: string | null;
  /** Optional status filter (pending|parsing|parsed|failed|…). */
  status?: string;
  /** Optional exact sourceKey filter. */
  sourceKey?: string;
}

export interface ListDocumentsPage {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
  nextCursor: string | null;
}

export function clampDocumentListLimit(raw?: number): number {
  if (raw === undefined || Number.isNaN(raw)) return 50;
  return Math.min(Math.max(Math.floor(raw), 1), 500);
}

type CursorPayload = { sk: string; v: number; id: string };

export function encodeDocumentCursor(doc: Document): string {
  const payload: CursorPayload = {
    sk: doc.sourceKey,
    v: doc.version,
    id: doc.id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeDocumentCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as Partial<CursorPayload>;
    if (
      typeof parsed.sk !== "string" ||
      typeof parsed.v !== "number" ||
      typeof parsed.id !== "string"
    ) {
      return null;
    }
    return { sk: parsed.sk, v: parsed.v, id: parsed.id };
  } catch {
    return null;
  }
}

/** Stable list order: sourceKey, version, id. */
export function compareDocuments(a: Document, b: Document): number {
  if (a.sourceKey !== b.sourceKey) {
    return a.sourceKey < b.sourceKey ? -1 : 1;
  }
  if (a.version !== b.version) return a.version - b.version;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

/**
 * In-memory pagination helper for tests and adapters that load a full list.
 * Prefer repository `listPage` with DB skip/cursor in production.
 */
export function paginateDocumentList(
  items: Document[],
  opts: ListDocumentsOpts = {},
): ListDocumentsPage {
  let sorted = [...items].sort(compareDocuments);
  if (opts.status) {
    const status = opts.status.trim();
    sorted = sorted.filter((d) => d.status === status);
  }
  if (opts.sourceKey) {
    const sourceKey = opts.sourceKey.trim();
    sorted = sorted.filter((d) => d.sourceKey === sourceKey);
  }
  const limit = clampDocumentListLimit(opts.limit);
  let offset = Math.max(0, Math.floor(opts.offset ?? 0));

  if (opts.cursor) {
    const decoded = decodeDocumentCursor(opts.cursor);
    if (!decoded) {
      return { items: [], total: sorted.length, limit, offset: 0, nextCursor: null };
    }
    const idx = sorted.findIndex(
      (d) =>
        d.sourceKey === decoded.sk &&
        d.version === decoded.v &&
        d.id === decoded.id,
    );
    offset = idx >= 0 ? idx + 1 : sorted.length;
  }

  const page = sorted.slice(offset, offset + limit);
  const nextCursor =
    offset + limit < sorted.length && page.length > 0
      ? encodeDocumentCursor(page[page.length - 1]!)
      : null;

  return {
    items: page,
    total: sorted.length,
    limit,
    offset,
    nextCursor,
  };
}
