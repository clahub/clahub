import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthorInfo, CheckResult } from "@/lib/cla-check";

// Mock prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    exclusion: { findMany: vi.fn() },
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    signature: { findUnique: vi.fn() },
  },
}));

// Mock github module to avoid initialization side effects
vi.mock("@/lib/github", () => ({
  getInstallationOctokit: vi.fn(),
  getGitHubApp: vi.fn(),
}));

import { checkClaForCommitAuthors, createCheckRun, extractPRAuthors } from "@/lib/cla-check";
import { prisma } from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// checkClaForCommitAuthors
// ---------------------------------------------------------------------------

describe("checkClaForCommitAuthors", () => {
  it("returns allSigned when all authors have valid signatures", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
    mockPrisma.signature.findUnique.mockResolvedValue({
      id: 1,
      revokedAt: null,
    } as any);

    const authors: AuthorInfo[] = [
      { githubId: "123", login: "alice", email: "alice@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.allSigned).toBe(true);
    expect(result.signed).toHaveLength(1);
    expect(result.unsigned).toHaveLength(0);
  });

  it("returns unsigned when no user record exists", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const authors: AuthorInfo[] = [
      { githubId: "999", login: "unknown", email: "unknown@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.allSigned).toBe(false);
    expect(result.unsigned).toHaveLength(1);
  });

  it("returns unsigned when signature is revoked", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
    mockPrisma.signature.findUnique.mockResolvedValue({
      id: 1,
      revokedAt: new Date(),
    } as any);

    const authors: AuthorInfo[] = [
      { githubId: "123", login: "alice", email: "alice@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.allSigned).toBe(false);
    expect(result.unsigned).toHaveLength(1);
  });

  it("excludes bot authors via bot_auto exclusion", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([
      { id: 1, agreementId: 1, type: "bot_auto", githubLogin: null, githubTeamId: null, createdAt: new Date() },
    ] as any);

    const authors: AuthorInfo[] = [
      { githubId: "100", login: "dependabot[bot]", email: null },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.excluded).toHaveLength(1);
    expect(result.unsigned).toHaveLength(0);
    expect(result.allSigned).toBe(true);
  });

  it("excludes user by login via user exclusion", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([
      { id: 2, agreementId: 1, type: "user", githubLogin: "alice", githubTeamId: null, createdAt: new Date() },
    ] as any);

    const authors: AuthorInfo[] = [
      { githubId: "123", login: "alice", email: "alice@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.excluded).toHaveLength(1);
    expect(result.signed).toHaveLength(0);
  });

  it("falls back from githubId to email lookup", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null); // no match by githubId
    mockPrisma.user.findFirst
      .mockResolvedValueOnce({ id: 2 } as any); // match by email
    mockPrisma.signature.findUnique.mockResolvedValue({
      id: 1,
      revokedAt: null,
    } as any);

    const authors: AuthorInfo[] = [
      { githubId: "unknown-id", login: null, email: "alice@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.allSigned).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
    });
  });

  it("falls back from email to nickname lookup", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null); // no match by githubId
    mockPrisma.user.findFirst
      .mockResolvedValueOnce(null) // no match by email
      .mockResolvedValueOnce({ id: 3 } as any); // match by nickname
    mockPrisma.signature.findUnique.mockResolvedValue({
      id: 1,
      revokedAt: null,
    } as any);

    const authors: AuthorInfo[] = [
      { githubId: "unknown-id", login: "alice", email: "no-match@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.allSigned).toBe(true);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { nickname: "alice" },
    });
  });

  it("handles mixed results (signed + unsigned + excluded)", async () => {
    mockPrisma.exclusion.findMany.mockResolvedValue([
      { id: 1, agreementId: 1, type: "bot_auto", githubLogin: null, githubTeamId: null, createdAt: new Date() },
    ] as any);

    // Author 1: bot → excluded
    // Author 2: signed → signed
    // Author 3: no user → unsigned
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: 10 } as any) // alice found by githubId
      .mockResolvedValueOnce(null); // carol not found
    mockPrisma.user.findFirst
      .mockResolvedValue(null); // carol not found by email/nickname either
    mockPrisma.signature.findUnique.mockResolvedValueOnce({
      id: 1,
      revokedAt: null,
    } as any);

    const authors: AuthorInfo[] = [
      { githubId: null, login: "renovate[bot]", email: null },
      { githubId: "10", login: "alice", email: "alice@example.com" },
      { githubId: "99", login: "carol", email: "carol@example.com" },
    ];

    const result = await checkClaForCommitAuthors(1, authors);
    expect(result.excluded).toHaveLength(1);
    expect(result.signed).toHaveLength(1);
    expect(result.unsigned).toHaveLength(1);
    expect(result.allSigned).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createCheckRun
// ---------------------------------------------------------------------------

describe("createCheckRun", () => {
  function makeMockOctokit() {
    return { request: vi.fn().mockResolvedValue({}) } as any;
  }

  it("creates success check run when all signed", async () => {
    const octokit = makeMockOctokit();
    const result: CheckResult = {
      allSigned: true,
      signed: [{ githubId: "1", login: "alice", email: null }],
      unsigned: [],
      excluded: [],
    };

    await createCheckRun(octokit, "owner", "repo", "abc123", result, "owner", "repo");

    expect(octokit.request).toHaveBeenCalledWith(
      "POST /repos/{owner}/{repo}/check-runs",
      expect.objectContaining({
        conclusion: "success",
        output: expect.objectContaining({
          title: "All authors have signed the CLA",
        }),
      }),
    );
  });

  it("creates action_required check run when unsigned exist", async () => {
    const octokit = makeMockOctokit();
    const result: CheckResult = {
      allSigned: false,
      signed: [],
      unsigned: [{ githubId: "2", login: "bob", email: null }],
      excluded: [],
    };

    await createCheckRun(octokit, "owner", "repo", "abc123", result, "owner", "repo");

    expect(octokit.request).toHaveBeenCalledWith(
      "POST /repos/{owner}/{repo}/check-runs",
      expect.objectContaining({
        conclusion: "action_required",
        output: expect.objectContaining({
          title: "1 author(s) need to sign the CLA",
        }),
      }),
    );
  });

  it("includes signed section in summary when signed authors exist", async () => {
    const octokit = makeMockOctokit();
    const result: CheckResult = {
      allSigned: false,
      signed: [{ githubId: "1", login: "alice", email: null }],
      unsigned: [{ githubId: "2", login: "bob", email: null }],
      excluded: [],
    };

    await createCheckRun(octokit, "owner", "repo", "abc123", result, "owner", "repo");

    const summary = octokit.request.mock.calls[0][1].output.summary;
    expect(summary).toContain("**Signed:**");
    expect(summary).toContain("alice");
    expect(summary).toContain("bob");
  });

  it("includes excluded section in summary", async () => {
    const octokit = makeMockOctokit();
    const result: CheckResult = {
      allSigned: true,
      signed: [],
      unsigned: [],
      excluded: [{ githubId: null, login: "dependabot[bot]", email: null }],
    };

    await createCheckRun(octokit, "owner", "repo", "abc123", result, "owner", "repo");

    const summary = octokit.request.mock.calls[0][1].output.summary;
    expect(summary).toContain("**Excluded (bots/bypassed):**");
    expect(summary).toContain("dependabot[bot]");
  });

  it("uses email or 'Unknown' when login is null", async () => {
    const octokit = makeMockOctokit();
    const result: CheckResult = {
      allSigned: false,
      signed: [],
      unsigned: [
        { githubId: null, login: null, email: "unknown@example.com" },
        { githubId: null, login: null, email: null },
      ],
      excluded: [],
    };

    await createCheckRun(octokit, "owner", "repo", "abc123", result, "owner", "repo");

    const summary = octokit.request.mock.calls[0][1].output.summary;
    expect(summary).toContain("unknown@example.com");
    expect(summary).toContain("Unknown");
  });
});

// ---------------------------------------------------------------------------
// extractPRAuthors
// ---------------------------------------------------------------------------

describe("extractPRAuthors", () => {
  function makeMockOctokit(commits: any[]) {
    return {
      request: vi.fn().mockResolvedValue({ data: commits }),
    } as any;
  }

  it("extracts authors from PR commits", async () => {
    const octokit = makeMockOctokit([
      {
        author: { id: 1, login: "alice" },
        committer: { login: "alice" },
        commit: { author: { email: "alice@example.com" } },
      },
    ]);

    const result = await extractPRAuthors(octokit, "owner", "repo", 1);
    expect(result).toEqual([
      { githubId: "1", login: "alice", email: "alice@example.com" },
    ]);
  });

  it("deduplicates by githubId", async () => {
    const octokit = makeMockOctokit([
      {
        author: { id: 1, login: "alice" },
        committer: { login: "alice" },
        commit: { author: { email: "alice@example.com" } },
      },
      {
        author: { id: 1, login: "alice" },
        committer: { login: "alice" },
        commit: { author: { email: "alice2@example.com" } },
      },
    ]);

    const result = await extractPRAuthors(octokit, "owner", "repo", 1);
    expect(result).toHaveLength(1);
  });

  it("handles commits with no author", async () => {
    const octokit = makeMockOctokit([
      {
        author: null,
        committer: { login: "web-flow" },
        commit: { author: { email: "user@example.com" } },
      },
    ]);

    const result = await extractPRAuthors(octokit, "owner", "repo", 1);
    expect(result).toHaveLength(1);
    expect(result[0].githubId).toBeNull();
    expect(result[0].email).toBe("user@example.com");
  });

  it("returns empty array when no commits", async () => {
    const octokit = makeMockOctokit([]);
    const result = await extractPRAuthors(octokit, "owner", "repo", 1);
    expect(result).toEqual([]);
  });
});
