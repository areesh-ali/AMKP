import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./infrastructure/prisma.module";
import { TenancyModule } from "./tenancy/tenancy.module";
import { RetrieveModule } from "./retrieve/retrieve.module";
import { IngestModule } from "./ingest/ingest.module";
import { McpModule } from "./mcp/mcp.module";
import { ObservabilityModule } from "./observability/observability.module";
import { EvalModule } from "./eval/eval.module";

@Module({
  imports: [
    PrismaModule,
    TenancyModule,
    RetrieveModule,
    IngestModule,
    McpModule,
    ObservabilityModule,
    EvalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
