import { Controller, Get, Header, Inject } from "@nestjs/common";
import { METRICS, type MetricsPort } from "@amkp/application";

/** Prometheus scrape endpoint (T-6.2 / FR-20). */
@Controller()
export class MetricsController {
  constructor(@Inject(METRICS) private readonly metrics: MetricsPort) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  scrape(): string {
    return this.metrics.renderPrometheus();
  }
}
