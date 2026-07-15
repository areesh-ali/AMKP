import type {
  EvidenceEnvelope,
  EvidenceItem,
  TenantId,
} from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";

export interface RetrieveQuery {
  query: string;
  preferCorrectness?: boolean;
  mode?: "single_pass" | "agentic";
}

export class MissingTenantContextError extends Error {
  readonly code = "MISSING_TENANT_CONTEXT";

  constructor() {
    super("Retrieve refused: TenantContext was not resolved from auth");
    this.name = "MissingTenantContextError";
  }
}

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
  /**
   * Search ONLY within the given namespace.
   * Adapters MUST ignore chunks outside this namespace.
   */
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
   * Never accepts client tenantId — only TenantContext from auth.
   */
  async execute(
    ctx: TenantContext | undefined | null,
    input: RetrieveQuery,
    options: { requestId: string; namespace: string },
  ): Promise<EvidenceEnvelope> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    if (!options.namespace) {
      throw new MissingTenantContextError();
    }

    const hits = await this.index.search({
      namespace: options.namespace,
      query: input.query,
      limit: 10,
    });

    const safe = hits.filter(
      (h) => h.namespace === options.namespace && h.tenantId === ctx.tenantId,
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
