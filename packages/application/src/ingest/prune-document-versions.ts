import type { DocumentId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import {
  MissingTenantContextError,
  ValidationError,
} from "../tenancy/ports";
import type { DocumentRepository } from "./ports";
import { DeleteDocumentUseCase } from "./delete-document";

const DEFAULT_KEEP = 10;

/** When set (≥1), keep at most N versions per sourceKey (newest). */
export function documentVersionRetention(): number | null {
  const raw = process.env.AMKP_DOCUMENT_VERSION_RETENTION?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
}

export interface PruneDocumentVersionsResult {
  sourceKey: string;
  kept: number;
  deleted: DocumentId[];
}

/**
 * Keep the newest `keep` Document versions for a sourceKey; delete older ones
 * (vector index + object storage via DeleteDocumentUseCase).
 */
export class PruneDocumentVersionsUseCase {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly deleteDocument: DeleteDocumentUseCase,
  ) {}

  async execute(
    ctx: TenantContext | undefined | null,
    sourceKey: string,
    keep?: number,
  ): Promise<PruneDocumentVersionsResult> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    const key = sourceKey?.trim();
    if (!key) {
      throw new ValidationError("sourceKey is required");
    }

    const retention =
      keep !== undefined && Number.isFinite(keep) && keep >= 1
        ? Math.floor(keep)
        : (documentVersionRetention() ?? DEFAULT_KEEP);
    if (retention < 1) {
      throw new ValidationError("keep must be >= 1");
    }

    const versions = await this.documents.listBySourceKey(ctx.tenantId, key);
    // listBySourceKey is ascending by version — drop from the front.
    const toDelete = versions.slice(0, Math.max(0, versions.length - retention));
    const deleted: DocumentId[] = [];
    for (const doc of toDelete) {
      await this.deleteDocument.execute(ctx, doc.id);
      deleted.push(doc.id);
    }

    return {
      sourceKey: key,
      kept: versions.length - deleted.length,
      deleted,
    };
  }
}
