import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError } from "../tenancy/ports";
import type {
  DocumentRepository,
  ListDocumentsOpts,
  ListDocumentsPage,
} from "./ports";

export class ListDocumentsUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    ctx: TenantContext | undefined | null,
    opts?: ListDocumentsOpts,
  ): Promise<ListDocumentsPage> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    return this.documents.listPage(ctx.tenantId, opts);
  }
}
