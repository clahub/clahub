import { describe, it, expect } from "vitest";
import { apiError, ErrorCode } from "@/lib/api-error";

describe("apiError", () => {
  it("returns a NextResponse with correct status", async () => {
    const res = apiError(ErrorCode.NOT_FOUND, "Not found", 404);

    expect(res.status).toBe(404);
  });

  it("returns structured error body", async () => {
    const res = apiError(ErrorCode.VALIDATION_ERROR, "Bad input", 400);
    const body = await res.json();

    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Bad input",
      },
    });
  });

  it("includes fields when provided", async () => {
    const res = apiError(ErrorCode.VALIDATION_ERROR, "Invalid", 400, {
      name: "required",
    });
    const body = await res.json();

    expect(body.error.fields).toEqual({ name: "required" });
  });

  it("omits fields when not provided", async () => {
    const res = apiError(ErrorCode.INTERNAL_ERROR, "Oops", 500);
    const body = await res.json();

    expect(body.error.fields).toBeUndefined();
  });
});

describe("ErrorCode", () => {
  it("has all expected codes", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.CONFLICT).toBe("CONFLICT");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });
});
