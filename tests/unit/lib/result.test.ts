import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError, ZodIssue } from "zod";
import { formatZodErrors, validationError, requireOwner } from "@/lib/actions/result";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
const mockAuth = vi.mocked(auth);

function makeZodError(issues: Partial<ZodIssue>[]): ZodError {
  return new ZodError(
    issues.map((i) => ({
      code: "custom",
      path: i.path ?? [],
      message: i.message ?? "Error",
      ...i,
    })) as ZodIssue[],
  );
}

describe("formatZodErrors", () => {
  it("maps issues to field error records", () => {
    const zodError = makeZodError([
      { path: ["name"], message: "Required" },
      { path: ["name"], message: "Too short" },
      { path: ["email"], message: "Invalid email" },
    ]);

    const result = formatZodErrors(zodError);

    expect(result).toEqual({
      name: ["Required", "Too short"],
      email: ["Invalid email"],
    });
  });

  it("joins nested paths with dots", () => {
    const zodError = makeZodError([
      { path: ["address", "street"], message: "Required" },
    ]);

    const result = formatZodErrors(zodError);

    expect(result).toEqual({
      "address.street": ["Required"],
    });
  });

  it("returns empty record for no issues", () => {
    const zodError = makeZodError([]);
    expect(formatZodErrors(zodError)).toEqual({});
  });
});

describe("validationError", () => {
  it("returns ActionResult with VALIDATION_ERROR code", () => {
    const zodError = makeZodError([
      { path: ["name"], message: "Required" },
    ]);

    const result = validationError(zodError);

    expect(result).toEqual({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      fieldErrors: { name: ["Required"] },
    });
  });
});

describe("requireOwner", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the user when session has owner role", async () => {
    const user = { id: "1", role: "owner", accessToken: "token" };
    mockAuth.mockResolvedValue({ user, expires: "" });

    const result = await requireOwner();

    expect(result).toEqual(user);
  });

  it("throws when no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });

  it("throws when user role is not owner", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", role: "contributor" },
      expires: "",
    });

    await expect(requireOwner()).rejects.toThrow("Unauthorized");
  });
});
