import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export type AmkpOtelShutdown = () => Promise<void>;

function otlpTracesUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/$/, "");
  if (trimmed.endsWith("/v1/traces")) return trimmed;
  return `${trimmed}/v1/traces`;
}

/**
 * Register a NodeTracerProvider + OTLP HTTP exporter when
 * `OTEL_EXPORTER_OTLP_ENDPOINT` is set (or AMKP_OTEL=1 with default localhost).
 * Returns a shutdown hook for graceful process exit.
 */
export async function startAmkpOtel(options?: {
  serviceName?: string;
}): Promise<AmkpOtelShutdown> {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
    (process.env.AMKP_OTEL === "1" ? "http://127.0.0.1:4318" : "");

  if (!endpoint) {
    return async () => {};
  }

  const serviceName =
    options?.serviceName ??
    process.env.OTEL_SERVICE_NAME?.trim() ??
    "amkp-api";

  const exporter = new OTLPTraceExporter({
    url: otlpTracesUrl(endpoint),
  });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();

  return async () => {
    await provider.shutdown();
  };
}
