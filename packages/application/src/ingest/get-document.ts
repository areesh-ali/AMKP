import type { Document, DocumentId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError } from "../tenancy/ports";
import {
  DocumentNotFoundError,
  type DocumentRepository,
} from "./ports";

export class GetDocumentUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    ctx: TenantContext | undefined | null,
    documentId: DocumentId,
  ): Promise<Document> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const doc = await this.documents.findByIdForTenant(
      ctx.tenantId,
      documentId,
    );
    if (!doc) {
      throw new DocumentNotFoundError(documentId);
    }
    return doc;
  }
}
