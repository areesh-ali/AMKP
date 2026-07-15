import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./infrastructure/prisma.module";
import { TenancyModule } from "./tenancy/tenancy.module";
import { RetrieveModule } from "./retrieve/retrieve.module";

@Module({
  imports: [PrismaModule, TenancyModule, RetrieveModule],
  controllers: [HealthController],
})
export class AppModule {}
