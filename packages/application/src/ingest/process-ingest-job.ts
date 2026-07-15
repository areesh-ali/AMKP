import type { DocumentId, TenantId } from "@amkp/domain";
import type { DocumentRepository, JobQueuePort } from "./ports";
import { DocumentNotFoundError } from "./ports";

/**
 * Worker-side: accept ingest job → mark document → enqueue parse (AD-5).
 * Parse Ladder itself is T-2.2+.
 */
export class ProcessIngestJobUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly jobs: JobQueuePort,
  ) {}

  async execute(input: {
    tenantId: TenantId;
    documentId: DocumentId;
  }): Promise<{ parseJobId: string }> {
    const doc = await this.documents.findByIdForTenant(
      input.tenantId,
      input.documentId,
    );
    if (!doc) {
      throw new DocumentNotFoundError(input.documentId);
    }

    await this.documents.updateStatus(
      input.tenantId,
      input.documentId,
      "accepted",
    );

    const parse = await this.jobs.enqueue("parse", {
      tenantId: input.tenantId,
      documentId: input.documentId,
    });

    await this.documents.updateStatus(
      input.tenantId,
      input.documentId,
      "parse_queued",
    );

    return { parseJobId: parse.jobId };
  }
}
