import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./infrastructure/prisma.module";
import { TenancyModule } from "./tenancy/tenancy.module";
import { RetrieveModule } from "./retrieve/retrieve.module";
import { IngestModule } from "./ingest/ingest.module";
import { McpModule } from "./mcp/mcp.module";

@Module({
  imports: [
    PrismaModule,
    TenancyModule,
    RetrieveModule,
    IngestModule,
    McpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
