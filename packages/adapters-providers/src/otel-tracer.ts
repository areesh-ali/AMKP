import { trace, type Span, type Tracer } from "@opentelemetry/api";
import type { SpanHandle, TracerPort } from "@amkp/application";

/**
 * TracerPort backed by the global OpenTelemetry TracerProvider.
 * Spans are no-ops until a provider is registered (see startAmkpOtel).
 */
export class OtelApiTracer implements TracerPort {
  private readonly tracer: Tracer;

  constructor(instrumentationName = "amkp") {
    this.tracer = trace.getTracer(
      instrumentationName,
      process.env.npm_package_version ?? "0.0.1",
    );
  }

  startSpan(name: string, attrs?: Record<string, string>): SpanHandle {
    const span: Span = this.tracer.startSpan(name, {
      attributes: attrs,
    });
    return {
      setAttribute(key, value) {
        span.setAttribute(key, value);
      },
      end() {
        span.end();
      },
    };
  }
}
