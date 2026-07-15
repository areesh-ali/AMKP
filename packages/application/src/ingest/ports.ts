import type {
  Document,
  DocumentId,
  DocumentStatus,
  JobId,
  TenantId,
} from "@amkp/domain";
import type {
  ListDocumentsOpts,
  ListDocumentsPage,
} from "./document-list-page";

export type { ListDocumentsOpts, ListDocumentsPage };

export interface CreateDocumentInput {
  tenantId: TenantId;
  filename: string;
  contentType: string;
  content: Buffer;
  /** Stable key for versioning; defaults to filename at use-case layer. */
  sourceKey: string;
  contentHash: string;
  version: number;
}

export interface DocumentRepository {
  create(input: CreateDocumentInput): Promise<Document>;
  findByIdForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Document | null>;
  /** Highest version for tenant+sourceKey, or null if none. */
  findLatestBySourceKey(
    tenantId: TenantId,
    sourceKey: string,
  ): Promise<Document | null>;
  /** Exact content-hash match for tenant+sourceKey (idempotent ingest). */
  findBySourceKeyAndContentHash(
    tenantId: TenantId,
    sourceKey: string,
    contentHash: string,
  ): Promise<Document | null>;
  /** Load stored bytes for parse workers (tenant-scoped). */
  getContentForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Buffer | null>;
  listByTenantId(tenantId: TenantId): Promise<Document[]>;
  /** All versions for tenant+sourceKey, ascending by version. */
  listBySourceKey(
    tenantId: TenantId,
    sourceKey: string,
  ): Promise<Document[]>;
  /** Tenant-scoped page (DB cursor/offset). Prefer over full listByTenantId. */
  listPage(
    tenantId: TenantId,
    opts?: ListDocumentsOpts,
  ): Promise<ListDocumentsPage>;
  /** Soft-delete: remove Document row (cascades chunks) for Tenant. */
  deleteForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<void>;
  updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: DocumentStatus,
  ): Promise<Document>;
  /** Storage keys referenced by Documents (for orphan GC). */
  listStorageKeys?(): Promise<string[]>;
}

export type QueueName = "ingest" | "parse" | "eval";

export interface IngestJobPayload {
  tenantId: TenantId;
  documentId: DocumentId;
}

export interface EnqueueResult {
  jobId: JobId;
  queue: QueueName;
}

export interface JobQueuePort {
  enqueue(
    queue: QueueName,
    payload: IngestJobPayload,
    options?: { jobId?: JobId },
  ): Promise<EnqueueResult>;
}

export const DOCUMENT_REPOSITORY = Symbol("DOCUMENT_REPOSITORY");
export const JOB_QUEUE = Symbol("JOB_QUEUE");

export class DocumentNotFoundError extends Error {
  readonly code = "DOCUMENT_NOT_FOUND";

  constructor(documentId: DocumentId) {
    super(`Document not found: ${documentId}`);
    this.name = "DocumentNotFoundError";
  }
}

/** Thrown when tenant+sourceKey+version or contentHash unique constraint fires. */
export class DocumentUniqueConflictError extends Error {
  readonly code = "DOCUMENT_UNIQUE_CONFLICT";

  constructor(message = "Document unique constraint conflict") {
    super(message);
    this.name = "DocumentUniqueConflictError";
  }
}
