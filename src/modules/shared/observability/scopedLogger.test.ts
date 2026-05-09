import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScopedLogger } from "./scopedLogger";

describe("createScopedLogger", () => {
  const originalDebugObservability = process.env.DEBUG_OBSERVABILITY;
  const originalPublicDebugObservability =
    process.env.NEXT_PUBLIC_DEBUG_OBSERVABILITY;
  const originalSalesFlowDebug = process.env.NEXT_PUBLIC_DEBUG_SALES_FLOW;

  const restoreEnv = (key: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  };

  beforeEach(() => {
    delete process.env.DEBUG_OBSERVABILITY;
    delete process.env.NEXT_PUBLIC_DEBUG_OBSERVABILITY;
    delete process.env.NEXT_PUBLIC_DEBUG_SALES_FLOW;
  });

  afterEach(() => {
    restoreEnv("DEBUG_OBSERVABILITY", originalDebugObservability);
    restoreEnv(
      "NEXT_PUBLIC_DEBUG_OBSERVABILITY",
      originalPublicDebugObservability,
    );
    restoreEnv("NEXT_PUBLIC_DEBUG_SALES_FLOW", originalSalesFlowDebug);
    vi.restoreAllMocks();
  });

  it("suppresses verbose logs by default", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const logger = createScopedLogger("salesNote", { traceId: "trace-1" });
    logger.log("start", { customerMode: "PUBLIC" });
    logger.info("validated");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("emits verbose logs when DEBUG_OBSERVABILITY is enabled", () => {
    process.env.DEBUG_OBSERVABILITY = "true";
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const logger = createScopedLogger("salesNote", { traceId: "trace-1" });
    logger.log("start", {
      items: ["one", "two"],
      nested: { total: 3 },
    });

    expect(debugSpy).toHaveBeenCalledWith("[salesNote:trace-1] start", {
      items: "[Array(2)]",
      nested: "[Object]",
    });
  });

  it("always emits warnings and errors", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const logger = createScopedLogger("salesNote", { traceId: "trace-1" });
    logger.warn("validation_failed", { fieldErrors: ["customer"] });
    logger.error("failed", new Error("boom"));

    expect(warnSpy).toHaveBeenCalledWith("[salesNote:trace-1] validation_failed", {
      fieldErrors: "[Array(1)]",
    });
    expect(errorSpy).toHaveBeenCalledWith("[salesNote:trace-1] failed", {
      name: "Error",
      message: "boom",
      stack: expect.any(String),
    });
  });
});
