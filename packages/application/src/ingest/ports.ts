import type {
  Document,
  DocumentId,
  DocumentStatus,
  JobId,
  TenantId,
} from "@amkp/domain";

export interface CreateDocumentInput {
  tenantId: TenantId;
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface DocumentRepository {
  create(input: CreateDocumentInput): Promise<Document>;
  findByIdForTenant(
    tenantId: TenantId,
    documentId: DocumentId,
  ): Promise<Document | null>;
  listByTenantId(tenantId: TenantId): Promise<Document[]>;
  updateStatus(
    tenantId: TenantId,
    documentId: DocumentId,
    status: DocumentStatus,
  ): Promise<Document>;
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
