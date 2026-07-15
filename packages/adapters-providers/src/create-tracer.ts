import {
  ConsoleTracer,
  NoOpTracer,
  type TracerPort,
} from "@amkp/application";
import { OtelApiTracer } from "./otel-tracer";

/**
 * Prefer console debug, then OTel API tracer when OTLP/AMKP_OTEL is enabled,
 * else no-op.
 */
export function createAmkpTracerFromEnv(): TracerPort {
  if (process.env.AMKP_TRACE_CONSOLE === "1") {
    return new ConsoleTracer();
  }
  if (
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
    process.env.AMKP_OTEL === "1"
  ) {
    return new OtelApiTracer("amkp");
  }
  return new NoOpTracer();
}
