import type {
  EvidenceEnvelope,
  EvidenceItem,
  TenantId,
} from "@amkp/domain";
import { tenantVectorNamespace } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";

export interface RetrieveQuery {
  query: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
}

export { MissingTenantContextError };

export interface IndexedChunk {
  id: string;
  tenantId: TenantId;
  namespace: string;
  documentId: string;
  content: string;
  score?: number;
}

export interface VectorIndexPort {
  upsert(chunk: IndexedChunk): Promise<void>;
  search(input: {
    namespace: string;
    query: string;
    limit?: number;
  }): Promise<IndexedChunk[]>;
}

export const VECTOR_INDEX = Symbol("VECTOR_INDEX");

export class RetrieveUseCase {
  constructor(private readonly index: VectorIndexPort) {}

  /**
   * Fail-closed retrieve (AD-3 / FR-16).
   * Namespace is derived from auth TenantContext — never from client input.
   */
  async execute(
    ctx: TenantContext | undefined | null,
    input: RetrieveQuery,
    options: { requestId: string },
  ): Promise<EvidenceEnvelope> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }

    const query = input.query?.trim();
    if (!query) {
      throw new ValidationError("query is required");
    }

    const namespace = tenantVectorNamespace(ctx.tenantId);

    const hits = await this.index.search({
      namespace,
      query,
      limit: 10,
    });

    const safe = hits.filter(
      (h) => h.namespace === namespace && h.tenantId === ctx.tenantId,
    );

    const items: EvidenceItem[] = safe.map((h) => ({
      id: h.id,
      score: h.score ?? 1,
      citation: { documentId: h.documentId },
      content: h.content,
    }));

    return {
      schemaVersion: "1",
      requestId: options.requestId,
      tenantId: ctx.tenantId,
      outcome:
        items.length > 0
          ? { kind: "evidence", items }
          : {
              kind: "insufficient_evidence",
              reason: "no_matches",
              threshold: 0,
            },
      costEstimate: { currency: "USD", estimatedUsd: 0 },
      routerDecision: { mode: "single_pass", reasonCode: "default" },
    };
  }
}
