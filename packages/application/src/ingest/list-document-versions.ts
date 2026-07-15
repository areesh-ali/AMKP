import type { Document } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";
import type { DocumentRepository } from "./ports";

export class ListDocumentVersionsUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    ctx: TenantContext | undefined | null,
    sourceKey: string,
  ): Promise<Document[]> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const key = sourceKey.trim();
    if (!key) {
      throw new ValidationError("sourceKey is required");
    }
    return this.documents.listBySourceKey(ctx.tenantId, key);
  }
}
