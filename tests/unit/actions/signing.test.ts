import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agreement: { findUnique: vi.fn() },
    signature: { findUnique: vi.fn(), create: vi.fn() },
    fieldEntry: { createMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/cla-check", () => ({
  recheckOpenPRs: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/github", () => ({
  getInstallationOctokit: vi.fn(),
  getGitHubApp: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  }),
}));

import { signAgreement } from "@/lib/actions/signing";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recheckOpenPRs } from "@/lib/cla-check";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRecheckOpenPRs = vi.mocked(recheckOpenPRs);

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper to set up a valid session
function mockSession(userId = "1") {
  mockAuth.mockResolvedValue({
    user: { id: userId, email: "test@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
}

// Helper for a valid agreement with version and fields
function mockAgreement(overrides?: Partial<any>) {
  const agreement = {
    id: 1,
    deletedAt: null,
    ownerName: "owner",
    repoName: "repo",
    installationId: "123",
    versions: [{ id: 10, version: 1 }],
    fields: [
      {
        id: 100,
        label: "Full Name",
        dataType: "text",
        required: true,
        description: null,
        sortOrder: 0,
        enabled: true,
      },
    ],
    ...overrides,
  };
  mockPrisma.agreement.findUnique.mockResolvedValue(agreement as any);
  return agreement;
}

describe("signAgreement", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to sign this agreement",
      code: "UNAUTHORIZED",
    });
  });

  it("returns error when agreement not found", async () => {
    mockSession();
    mockPrisma.agreement.findUnique.mockResolvedValue(null);

    const result = await signAgreement({
      agreementId: 999,
      fields: {},
    });

    expect(result).toEqual({
      success: false,
      error: "Agreement not found",
      code: "NOT_FOUND",
    });
  });

  it("returns error when agreement is soft-deleted", async () => {
    mockSession();
    mockAgreement({ deletedAt: new Date() });

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({
      success: false,
      error: "Agreement not found",
      code: "NOT_FOUND",
    });
  });

  it("returns error when agreement has no version", async () => {
    mockSession();
    mockAgreement({ versions: [] });

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({
      success: false,
      error: "Agreement has no published version",
      code: "NOT_FOUND",
    });
  });

  it("returns validation errors for invalid field data", async () => {
    mockSession();
    mockAgreement();
    mockPrisma.signature.findUnique.mockResolvedValue(null);

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "" }, // required text field left empty
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Validation failed");
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!["field_100"]).toBeDefined();
    }
  });

  it("returns error when already signed", async () => {
    mockSession();
    mockAgreement();
    mockPrisma.signature.findUnique.mockResolvedValue({
      id: 1,
      revokedAt: null,
    } as any);

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({
      success: false,
      error: "You have already signed this agreement",
      code: "CONFLICT",
    });
  });

  it("succeeds and calls recheckOpenPRs on happy path", async () => {
    mockSession();
    const agreement = mockAgreement();
    mockPrisma.signature.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        signature: {
          create: vi.fn().mockResolvedValue({ id: 50 }),
        },
        fieldEntry: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({ success: true });
    expect(mockRecheckOpenPRs).toHaveBeenCalledWith(agreement.id);
  });

  it("handles race condition (unique constraint violation)", async () => {
    mockSession();
    mockAgreement();
    mockPrisma.signature.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`userId`,`agreementId`)"),
    );

    const result = await signAgreement({
      agreementId: 1,
      fields: { field_100: "Alice" },
    });

    expect(result).toEqual({
      success: false,
      error: "You have already signed this agreement",
      code: "CONFLICT",
    });
  });

  it("re-throws non-constraint errors", async () => {
    mockSession();
    mockAgreement();
    mockPrisma.signature.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockRejectedValue(new Error("Database connection failed"));

    await expect(
      signAgreement({ agreementId: 1, fields: { field_100: "Alice" } }),
    ).rejects.toThrow("Database connection failed");
  });
});
