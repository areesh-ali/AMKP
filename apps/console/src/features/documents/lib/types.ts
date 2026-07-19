export type DocRow = {
  documentId?: string;
  id?: string;
  sourceKey?: string;
  status?: string;
  version?: number | string;
  updatedAt?: string;
  createdAt?: string;
  filename?: string;
  contentType?: string;
  byteSize?: number;
  contentHash?: string;
};

export type VersionRow = {
  documentId: string;
  sourceKey?: string;
  version?: number;
  status?: string;
  filename?: string;
  contentHash?: string;
  createdAt?: string;
  byteSize?: number;
};

export type ChunkRow = {
  chunkId: string;
  documentId?: string;
  ordinal?: number;
  parseTier?: string | number;
  parseConfidence?: number;
  content?: string;
  createdAt?: string;
};

export function asDocs(items: unknown[]): DocRow[] {
  return items.filter(
    (i): i is DocRow => typeof i === "object" && i !== null,
  );
}

export function asVersions(items: unknown[]): VersionRow[] {
  return items.filter(
    (i): i is VersionRow =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as VersionRow).documentId === "string",
  );
}

export function asChunks(items: unknown[]): ChunkRow[] {
  return items.filter(
    (i): i is ChunkRow =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as ChunkRow).chunkId === "string",
  );
}

export function docId(d: DocRow): string {
  return d.documentId ?? d.id ?? "";
}

export function statusTone(
  status?: string,
): "ok" | "warn" | "danger" | "muted" {
  const s = (status ?? "").toLowerCase();
  if (s === "parsed" || s === "ready" || s === "completed") return "ok";
  if (s === "pending" || s === "processing" || s === "in_progress") {
    return "warn";
  }
  if (s === "failed" || s === "error") return "danger";
  return "muted";
}
