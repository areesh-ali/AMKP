import type { DocumentId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError } from "../tenancy/ports";
import { DocumentNotFoundError, type DocumentRepository } from "./ports";

export class GetDocumentContentUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    ctx: TenantContext | undefined | null,
    documentId: DocumentId,
  ): Promise<{
    filename: string;
    contentType: string;
    content: Buffer;
  }> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const doc = await this.documents.findByIdForTenant(ctx.tenantId, documentId);
    if (!doc) {
      throw new DocumentNotFoundError(documentId);
    }
    const content = await this.documents.getContentForTenant(
      ctx.tenantId,
      documentId,
    );
    if (!content) {
      throw new DocumentNotFoundError(documentId);
    }
    return {
      filename: doc.filename,
      contentType: doc.contentType,
      content,
    };
  }
}
