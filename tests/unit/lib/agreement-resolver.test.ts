import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agreement: { findFirst: vi.fn() },
  },
}));

import { findAgreementForRepo } from "@/lib/agreement-resolver";
import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findAgreementForRepo", () => {
  const repoAgreement = {
    id: 1,
    scope: "repo",
    githubRepoId: "100",
    githubOrgId: null,
    ownerName: "my-org",
    repoName: "my-repo",
    deletedAt: null,
  };

  const orgAgreement = {
    id: 2,
    scope: "org",
    githubRepoId: null,
    githubOrgId: "200",
    ownerName: "my-org",
    repoName: null,
    deletedAt: null,
  };

  it("returns repo-specific agreement when one exists", async () => {
    mockPrisma.agreement.findFirst.mockResolvedValueOnce(repoAgreement as any);

    const result = await findAgreementForRepo("100", "200");

    expect(result).toEqual(repoAgreement);
    expect(mockPrisma.agreement.findFirst).toHaveBeenCalledTimes(1);
    expect(mockPrisma.agreement.findFirst).toHaveBeenCalledWith({
      where: { githubRepoId: "100", deletedAt: null },
    });
  });

  it("falls back to org agreement when no repo agreement exists", async () => {
    mockPrisma.agreement.findFirst
      .mockResolvedValueOnce(null) // repo lookup
      .mockResolvedValueOnce(orgAgreement as any); // org lookup

    const result = await findAgreementForRepo("999", "200");

    expect(result).toEqual(orgAgreement);
    expect(mockPrisma.agreement.findFirst).toHaveBeenCalledTimes(2);
    expect(mockPrisma.agreement.findFirst).toHaveBeenNthCalledWith(2, {
      where: { githubOrgId: "200", scope: "org", deletedAt: null },
    });
  });

  it("returns null when neither repo nor org agreement exists", async () => {
    mockPrisma.agreement.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await findAgreementForRepo("999", "999");

    expect(result).toBeNull();
    expect(mockPrisma.agreement.findFirst).toHaveBeenCalledTimes(2);
  });

  it("prioritizes repo agreement over org agreement", async () => {
    mockPrisma.agreement.findFirst.mockResolvedValueOnce(repoAgreement as any);

    const result = await findAgreementForRepo("100", "200");

    expect(result).toEqual(repoAgreement);
    // Should not even query for org agreement
    expect(mockPrisma.agreement.findFirst).toHaveBeenCalledTimes(1);
  });

  it("skips soft-deleted agreements (handled by deletedAt: null filter)", async () => {
    mockPrisma.agreement.findFirst
      .mockResolvedValueOnce(null) // repo: deleted ones filtered by query
      .mockResolvedValueOnce(null); // org: same

    const result = await findAgreementForRepo("100", "200");

    expect(result).toBeNull();
    // Both queries include deletedAt: null
    expect(mockPrisma.agreement.findFirst).toHaveBeenNthCalledWith(1, {
      where: { githubRepoId: "100", deletedAt: null },
    });
    expect(mockPrisma.agreement.findFirst).toHaveBeenNthCalledWith(2, {
      where: { githubOrgId: "200", scope: "org", deletedAt: null },
    });
  });
});
