import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { TenancyModule } from "./tenancy/tenancy.module";

@Module({
  imports: [TenancyModule],
  controllers: [HealthController],
})
export class AppModule {}
