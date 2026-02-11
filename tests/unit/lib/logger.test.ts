import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("outputs valid JSON with required fields", () => {
    logger.info("test message");

    expect(infoSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.timestamp).toBeDefined();
  });

  it("includes context fields in output", () => {
    logger.info("request", { route: "/api/test", method: "GET" });

    const output = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(output.route).toBe("/api/test");
    expect(output.method).toBe("GET");
  });

  it("logs warnings to console.warn", () => {
    logger.warn("something fishy", { action: "test" });

    expect(warnSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("warn");
    expect(output.action).toBe("test");
  });

  it("extracts Error details in error logs", () => {
    const err = new Error("boom");
    logger.error("something failed", { action: "test" }, err);

    expect(errorSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.errorName).toBe("Error");
    expect(output.errorMessage).toBe("boom");
    expect(output.stack).toBeDefined();
  });

  it("handles non-Error values in error logs gracefully", () => {
    logger.error("failed", undefined, "just a string");

    const output = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("error");
    expect(output.errorName).toBeUndefined();
    expect(output.errorMessage).toBeUndefined();
  });
});
