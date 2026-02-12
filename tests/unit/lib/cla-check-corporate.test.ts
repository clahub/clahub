import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    exclusion: { findMany: vi.fn() },
    signature: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    agreement: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/github", () => ({
  getInstallationOctokit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkClaForCommitAuthors, type AuthorInfo } from "@/lib/cla-check";
import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no exclusions, no corporate signatures
  mockPrisma.exclusion.findMany.mockResolvedValue([]);
  mockPrisma.signature.findMany.mockResolvedValue([]);
});

describe("checkClaForCommitAuthors — corporate coverage", () => {
  it("marks author as signed when they have an individual signature", async () => {
    const author: AuthorInfo = { githubId: "1", login: "alice", email: "alice@example.com" };

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 10 } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce({
      id: 1, revokedAt: null, signatureType: "individual",
    } as any);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.signed).toHaveLength(1);
    expect(result.unsigned).toHaveLength(0);
    expect(result.corporateCovered).toHaveLength(0);
    expect(result.allSigned).toBe(true);
  });

  it("marks author as corporate-covered when email domain matches corporate signature", async () => {
    const author: AuthorInfo = { githubId: "2", login: "bob", email: "bob@acme.com" };

    // Corporate signature exists for acme.com
    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    // User found but no individual signature
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 20, email: "bob@acme.com" } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.signed).toHaveLength(0);
    expect(result.corporateCovered).toHaveLength(1);
    expect(result.corporateCovered[0].login).toBe("bob");
    expect(result.unsigned).toHaveLength(0);
    expect(result.allSigned).toBe(true);
  });

  it("marks unknown author as corporate-covered when email domain matches", async () => {
    const author: AuthorInfo = { githubId: null, login: null, email: "newcomer@acme.com" };

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    // No user found
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.corporateCovered).toHaveLength(1);
    expect(result.unsigned).toHaveLength(0);
    expect(result.allSigned).toBe(true);
  });

  it("marks author as unsigned when no individual signature and no corporate coverage", async () => {
    const author: AuthorInfo = { githubId: "3", login: "charlie", email: "charlie@other.com" };

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 30, email: "charlie@other.com" } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.signed).toHaveLength(0);
    expect(result.corporateCovered).toHaveLength(0);
    expect(result.unsigned).toHaveLength(1);
    expect(result.allSigned).toBe(false);
  });

  it("does not count revoked corporate signatures", async () => {
    const author: AuthorInfo = { githubId: "4", login: "dave", email: "dave@acme.com" };

    // No active corporate signatures (revoked ones excluded by query)
    mockPrisma.signature.findMany.mockResolvedValueOnce([]);

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 40, email: "dave@acme.com" } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.unsigned).toHaveLength(1);
    expect(result.corporateCovered).toHaveLength(0);
  });

  it("handles multiple corporate signatures with different domains", async () => {
    const authors: AuthorInfo[] = [
      { githubId: "5", login: "eve", email: "eve@acme.com" },
      { githubId: "6", login: "frank", email: "frank@bigcorp.io" },
      { githubId: "7", login: "grace", email: "grace@uncovered.org" },
    ];

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
      { companyDomain: "bigcorp.io" } as any,
    ]);

    // All users found, none have individual signatures
    for (const a of authors) {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: Number(a.githubId) * 10, email: a.email } as any);
      mockPrisma.signature.findUnique.mockResolvedValueOnce(null);
    }

    const result = await checkClaForCommitAuthors(100, authors);

    expect(result.corporateCovered).toHaveLength(2);
    expect(result.unsigned).toHaveLength(1);
    expect(result.unsigned[0].login).toBe("grace");
  });

  it("does not corporate-cover author with no email", async () => {
    const author: AuthorInfo = { githubId: "8", login: "hank", email: null };

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 80, email: null } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.unsigned).toHaveLength(1);
    expect(result.corporateCovered).toHaveLength(0);
  });

  it("uses user.email for corporate coverage when author.email is missing", async () => {
    const author: AuthorInfo = { githubId: "9", login: "iris", email: null };

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    // User has email on their profile
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 90, email: "iris@acme.com" } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.corporateCovered).toHaveLength(1);
    expect(result.unsigned).toHaveLength(0);
  });

  it("domain matching is case-insensitive", async () => {
    const author: AuthorInfo = { githubId: "10", login: "jack", email: "jack@ACME.COM" };

    mockPrisma.signature.findMany.mockResolvedValueOnce([
      { companyDomain: "acme.com" } as any,
    ]);

    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 100, email: "jack@ACME.COM" } as any);
    mockPrisma.signature.findUnique.mockResolvedValueOnce(null);

    const result = await checkClaForCommitAuthors(100, [author]);

    expect(result.corporateCovered).toHaveLength(1);
  });
});
