import type { DocumentId, JobId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import {
  MissingTenantContextError,
  ValidationError,
} from "../tenancy/ports";
import {
  DocumentNotFoundError,
  type DocumentRepository,
  type JobQueuePort,
} from "./ports";

/**
 * Re-enqueue parse for an existing Document (ops / failed recovery).
 */
export class ReparseDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly jobs: JobQueuePort,
  ) {}

  async execute(
    ctx: TenantContext | undefined | null,
    documentId: string,
  ): Promise<{ documentId: DocumentId; jobId: JobId; status: string }> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const id = documentId?.trim();
    if (!id) {
      throw new ValidationError("documentId is required");
    }

    const doc = await this.documents.findByIdForTenant(ctx.tenantId, id);
    if (!doc) {
      throw new DocumentNotFoundError(id);
    }

    await this.documents.updateStatus(ctx.tenantId, id, "parse_queued");
    const { jobId } = await this.jobs.enqueue("parse", {
      tenantId: ctx.tenantId,
      documentId: id,
    });

    return { documentId: id, jobId, status: "parse_queued" };
  }
}
