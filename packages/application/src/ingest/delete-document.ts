import { tenantVectorNamespace } from "@amkp/domain";
import type { DocumentId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import {
  MissingTenantContextError,
  ValidationError,
} from "../tenancy/ports";
import { DocumentNotFoundError, type DocumentRepository } from "./ports";
import type { VectorIndexPort } from "../retrieve/retrieve";
import type { RetrieveCachePort } from "../retrieve/retrieve";

export class DeleteDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly index?: VectorIndexPort,
    private readonly cache?: RetrieveCachePort,
  ) {}

  async execute(
    ctx: TenantContext | undefined | null,
    documentId: string,
  ): Promise<{ documentId: DocumentId; deleted: true }> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const id = documentId?.trim();
    if (!id) {
      throw new ValidationError("documentId is required");
    }

    const existing = await this.documents.findByIdForTenant(ctx.tenantId, id);
    if (!existing) {
      throw new DocumentNotFoundError(id);
    }

    if (this.index?.deleteByDocument) {
      await this.index.deleteByDocument({
        namespace: tenantVectorNamespace(ctx.tenantId),
        documentId: id,
      });
    }

    await this.documents.deleteForTenant(ctx.tenantId, id);
    if (this.cache?.clearTenant) {
      await this.cache.clearTenant(ctx.tenantId);
    }
    return { documentId: id, deleted: true };
  }
}
