import { createHash, randomUUID } from "node:crypto";
import type { Document, JobId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import {
  MissingTenantContextError,
  ValidationError,
} from "../tenancy/ports";
import type { DocumentRepository, JobQueuePort } from "./ports";

export interface IngestDocumentInput {
  filename: string;
  contentType?: string;
  /** Raw bytes (decoded from base64 at the HTTP edge). */
  content: Buffer;
  /**
   * Stable source identity for versioning (FR-7).
   * Defaults to filename when omitted.
   */
  sourceKey?: string;
}

export interface IngestDocumentResult {
  document: Document;
  jobId: JobId;
}

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB MVP soft limit

export function maxDocumentBytes(): number {
  const raw = process.env.AMKP_MAX_DOCUMENT_BYTES;
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

export function hashDocumentContent(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export class IngestDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly jobs: JobQueuePort,
  ) {}

  async execute(
    ctx: TenantContext | undefined | null,
    input: IngestDocumentInput,
  ): Promise<IngestDocumentResult> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }

    const filename = input.filename?.trim();
    if (!filename) {
      throw new ValidationError("filename is required");
    }

    if (!input.content || input.content.length === 0) {
      throw new ValidationError("content is required");
    }

    const maxBytes = maxDocumentBytes();
    if (input.content.length > maxBytes) {
      throw new ValidationError(`content exceeds ${maxBytes} bytes`);
    }

    const contentType =
      input.contentType?.trim() || "application/octet-stream";
    const allowed = process.env.AMKP_ALLOWED_CONTENT_TYPES?.trim();
    if (allowed) {
      const set = new Set(
        allowed.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      );
      if (!set.has(contentType.toLowerCase())) {
        throw new ValidationError(
          `contentType ${contentType} is not allowed`,
        );
      }
    }
    const sourceKey = (input.sourceKey?.trim() || filename).trim();
    if (!sourceKey) {
      throw new ValidationError("sourceKey is required");
    }

    const contentHash = hashDocumentContent(input.content);
    const latest = await this.documents.findLatestBySourceKey(
      ctx.tenantId,
      sourceKey,
    );
    if (latest && latest.contentHash === contentHash) {
      // Idempotent re-ingest of identical bytes — return existing Document, no new job.
      return {
        document: latest,
        jobId: `noop_${randomUUID()}` as JobId,
      };
    }
    const version = (latest?.version ?? 0) + 1;

    const document = await this.documents.create({
      tenantId: ctx.tenantId,
      filename,
      contentType,
      content: input.content,
      sourceKey,
      contentHash,
      version,
    });

    const jobId = `job_${randomUUID().replace(/-/g, "")}`;
    const enqueued = await this.jobs.enqueue(
      "ingest",
      { tenantId: ctx.tenantId, documentId: document.id },
      { jobId },
    );

    return { document, jobId: enqueued.jobId };
  }
}
