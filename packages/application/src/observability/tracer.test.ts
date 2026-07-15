import { describe, expect, it } from "vitest";
import { ConsoleTracer, NoOpTracer, createTracerFromEnv } from "./tracer";

describe("tracer", () => {
  it("no-op does not throw", () => {
    const span = new NoOpTracer().startSpan("retrieve");
    span.setAttribute("tenant", "ten_a");
    span.end();
  });

  it("createTracerFromEnv defaults to no-op", () => {
    const prev = process.env.AMKP_TRACE_CONSOLE;
    delete process.env.AMKP_TRACE_CONSOLE;
    expect(createTracerFromEnv()).toBeInstanceOf(NoOpTracer);
    process.env.AMKP_TRACE_CONSOLE = "1";
    expect(createTracerFromEnv()).toBeInstanceOf(ConsoleTracer);
    if (prev === undefined) delete process.env.AMKP_TRACE_CONSOLE;
    else process.env.AMKP_TRACE_CONSOLE = prev;
  });
});
