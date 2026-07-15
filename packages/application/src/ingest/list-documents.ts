import type { Document } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError } from "../tenancy/ports";
import type { DocumentRepository } from "./ports";

export class ListDocumentsUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(ctx: TenantContext | undefined | null): Promise<Document[]> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    return this.documents.listByTenantId(ctx.tenantId);
  }
}
