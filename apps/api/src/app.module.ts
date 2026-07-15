import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./infrastructure/prisma.module";
import { TenancyModule } from "./tenancy/tenancy.module";

@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [HealthController],
})
export class AppModule {}
