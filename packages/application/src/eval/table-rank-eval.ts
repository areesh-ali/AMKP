import type { TenantId } from "@amkp/domain";
import type { TenantContext } from "../tenancy/types";
import { MissingTenantContextError, ValidationError } from "../tenancy/ports";
import type { RetrieveUseCase } from "../retrieve/retrieve";
import {
  compareTableRankAblation,
  type TableRankAblationReport,
} from "./table-rank";

export interface TableRankEvalReport {
  tenantId: TenantId;
  requestId: string;
  completedAt: string;
  fixturePack: "multimodal_chart_table_v1";
  results: TableRankAblationReport[];
  summary: {
    queries: number;
    avgMultimodalTableRank: number;
    avgTextOnlyTableRank: number;
    avgLift: number;
  };
}

export class RunTableRankAblationUseCase {
  constructor(private readonly retrieve: RetrieveUseCase) {}

  async execute(
    ctx: TenantContext | undefined | null,
    input: { queries: string[] },
    options: { requestId: string },
  ): Promise<TableRankEvalReport> {
    if (!ctx?.tenantId || !ctx.accountId) {
      throw new MissingTenantContextError();
    }
    if (!Array.isArray(input.queries) || input.queries.length === 0) {
      throw new ValidationError("queries must be a non-empty array");
    }

    const results: TableRankAblationReport[] = [];
    for (const query of input.queries) {
      const q = query?.trim();
      if (!q) throw new ValidationError("query must be non-empty");
      const envelope = await this.retrieve.execute(
        ctx,
        { query: q },
        { requestId: `${options.requestId}_${results.length}` },
      );
      const items =
        envelope.outcome.kind === "evidence" ? envelope.outcome.items : [];
      results.push(compareTableRankAblation({ query: q, multimodalItems: items }));
    }

    const avg = (xs: number[]) =>
      xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

    return {
      tenantId: ctx.tenantId,
      requestId: options.requestId,
      completedAt: new Date().toISOString(),
      fixturePack: "multimodal_chart_table_v1",
      results,
      summary: {
        queries: results.length,
        avgMultimodalTableRank: avg(results.map((r) => r.multimodal.tableRank)),
        avgTextOnlyTableRank: avg(results.map((r) => r.textOnly.tableRank)),
        avgLift: avg(results.map((r) => r.lift)),
      },
    };
  }
}
