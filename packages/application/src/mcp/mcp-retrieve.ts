import type { EvidenceEnvelope, DocumentId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { ValidationError } from "../tenancy/ports";
import type { RetrieveQuery, RetrieveUseCase } from "../retrieve/retrieve";

/** Product-credential MCP surface — no admin / cross-Tenant tools (T-5.3). */
export const MCP_PRODUCT_TOOL_MANIFEST = {
  schemaVersion: "1" as const,
  audience: "product" as const,
  tools: [
    {
      name: "retrieve",
      description:
        "Hybrid Retrieve for the authenticated Tenant. Returns EvidenceEnvelope only.",
      inputSchema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string" },
          preferCorrectness: { type: "boolean" },
          documentIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional Document ID filter within the authenticated Tenant only",
          },
        },
        additionalProperties: false,
      },
    },
  ],
  /** Explicitly empty — Product MCP credentials must not see admin tools. */
  adminTools: [] as const,
};

export interface McpRetrieveInput {
  query: string;
  preferCorrectness?: boolean;
  /** Filter to these Document IDs after Tenant-scoped retrieve (never crosses Tenants). */
  documentIds?: DocumentId[];
}

/**
 * Thin MCP retrieve facade over RetrieveUseCase (AD-6 / T-5.3).
 * Tenant comes only from auth context — never from tool params.
 */
export class McpRetrieveUseCase {
  constructor(private readonly retrieve: RetrieveUseCase) {}

  async execute(
    ctx: TenantContext | undefined | null,
    input: McpRetrieveInput,
    options: { requestId: string },
  ): Promise<EvidenceEnvelope> {
    const query = input.query?.trim();
    if (!query) {
      throw new ValidationError("query is required");
    }

    const retrieveInput: RetrieveQuery = {
      query,
      preferCorrectness: input.preferCorrectness === true,
    };

    const envelope = await this.retrieve.execute(ctx, retrieveInput, options);

    const filterIds = input.documentIds?.filter(Boolean) ?? [];
    if (filterIds.length === 0) {
      return envelope;
    }

    if (envelope.outcome.kind !== "evidence") {
      return envelope;
    }

    const allowed = new Set(filterIds);
    const items = envelope.outcome.items.filter((i) =>
      allowed.has(i.citation.documentId),
    );

    return {
      ...envelope,
      outcome: { kind: "evidence", items },
    };
  }
}
