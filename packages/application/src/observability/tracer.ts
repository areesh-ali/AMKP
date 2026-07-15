/**
 * Lightweight OpenTelemetry-shaped tracing port (MVP stub).
 * Swap for @opentelemetry/api when exporting to a collector.
 */
export interface SpanHandle {
  setAttribute(key: string, value: string | number | boolean): void;
  end(): void;
}

export interface TracerPort {
  startSpan(name: string, attrs?: Record<string, string>): SpanHandle;
}

export const TRACER = Symbol("TRACER");

export class NoOpTracer implements TracerPort {
  startSpan(
    _name: string,
    _attrs?: Record<string, string>,
  ): SpanHandle {
    return {
      setAttribute() {},
      end() {},
    };
  }
}

/** Console tracer for local debug (AMKP_TRACE_CONSOLE=1). */
export class ConsoleTracer implements TracerPort {
  startSpan(name: string, attrs?: Record<string, string>): SpanHandle {
    const t0 = Date.now();
    // eslint-disable-next-line no-console
    console.log(`[trace] start ${name}`, attrs ?? {});
    return {
      setAttribute(key, value) {
        // eslint-disable-next-line no-console
        console.log(`[trace] attr ${name} ${key}=${String(value)}`);
      },
      end() {
        // eslint-disable-next-line no-console
        console.log(`[trace] end ${name} ${Date.now() - t0}ms`);
      },
    };
  }
}

export function createTracerFromEnv(): TracerPort {
  if (process.env.AMKP_TRACE_CONSOLE === "1") {
    return new ConsoleTracer();
  }
  return new NoOpTracer();
}
