import { describe, expect, it } from "vitest";
import { ConsoleTracer, NoOpTracer } from "@amkp/application";
import { createAmkpTracerFromEnv } from "./create-tracer";
import { OtelApiTracer } from "./otel-tracer";
import { startAmkpOtel } from "./otel-bootstrap";

describe("createAmkpTracerFromEnv", () => {
  it("defaults to no-op", () => {
    const prevConsole = process.env.AMKP_TRACE_CONSOLE;
    const prevOtel = process.env.AMKP_OTEL;
    const prevEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.AMKP_TRACE_CONSOLE;
    delete process.env.AMKP_OTEL;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    expect(createAmkpTracerFromEnv()).toBeInstanceOf(NoOpTracer);

    if (prevConsole === undefined) delete process.env.AMKP_TRACE_CONSOLE;
    else process.env.AMKP_TRACE_CONSOLE = prevConsole;
    if (prevOtel === undefined) delete process.env.AMKP_OTEL;
    else process.env.AMKP_OTEL = prevOtel;
    if (prevEndpoint === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = prevEndpoint;
  });

  it("uses console when AMKP_TRACE_CONSOLE=1", () => {
    const prev = process.env.AMKP_TRACE_CONSOLE;
    process.env.AMKP_TRACE_CONSOLE = "1";
    expect(createAmkpTracerFromEnv()).toBeInstanceOf(ConsoleTracer);
    if (prev === undefined) delete process.env.AMKP_TRACE_CONSOLE;
    else process.env.AMKP_TRACE_CONSOLE = prev;
  });

  it("uses OTel API tracer when AMKP_OTEL=1", () => {
    const prevConsole = process.env.AMKP_TRACE_CONSOLE;
    const prevOtel = process.env.AMKP_OTEL;
    delete process.env.AMKP_TRACE_CONSOLE;
    process.env.AMKP_OTEL = "1";
    expect(createAmkpTracerFromEnv()).toBeInstanceOf(OtelApiTracer);
    if (prevConsole === undefined) delete process.env.AMKP_TRACE_CONSOLE;
    else process.env.AMKP_TRACE_CONSOLE = prevConsole;
    if (prevOtel === undefined) delete process.env.AMKP_OTEL;
    else process.env.AMKP_OTEL = prevOtel;
  });
});

describe("OtelApiTracer", () => {
  it("starts and ends spans without a registered provider", () => {
    const span = new OtelApiTracer("amkp-test").startSpan("retrieve", {
      tenant: "ten_a",
    });
    span.setAttribute("mode", "single");
    span.end();
  });
});

describe("startAmkpOtel", () => {
  it("no-ops when endpoint unset", async () => {
    const prev = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const prevOtel = process.env.AMKP_OTEL;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.AMKP_OTEL;
    const shutdown = await startAmkpOtel();
    await shutdown();
    if (prev === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = prev;
    if (prevOtel === undefined) delete process.env.AMKP_OTEL;
    else process.env.AMKP_OTEL = prevOtel;
  });
});
