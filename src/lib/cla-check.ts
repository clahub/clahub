import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";
import { logger } from "@/lib/logger";
import type { Exclusion } from "@/generated/prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthorInfo = {
  githubId: string | null;
  login: string | null;
  email: string | null;
};

export type CheckResult = {
  allSigned: boolean;
  signed: AuthorInfo[];
  unsigned: AuthorInfo[];
  excluded: AuthorInfo[];
};

// ---------------------------------------------------------------------------
// Exclusion helpers
// ---------------------------------------------------------------------------

function isExcluded(author: AuthorInfo, exclusions: Exclusion[]): boolean {
  return exclusions.some((ex) => {
    if (ex.type === "bot_auto") return author.login?.endsWith("[bot]") ?? false;
    if (ex.type === "user" && ex.githubLogin)
      return author.login === ex.githubLogin;
    return false;
  });
}

// ---------------------------------------------------------------------------
// CLA verification
// ---------------------------------------------------------------------------

export async function checkClaForCommitAuthors(
  agreementId: number,
  authors: AuthorInfo[],
): Promise<CheckResult> {
  const exclusions = await prisma.exclusion.findMany({
    where: { agreementId },
  });

  const signed: AuthorInfo[] = [];
  const unsigned: AuthorInfo[] = [];
  const excluded: AuthorInfo[] = [];

  for (const author of authors) {
    if (isExcluded(author, exclusions)) {
      excluded.push(author);
      continue;
    }

    // Try to find the user: by githubId first, then email, then nickname
    let user = null;
    if (author.githubId) {
      user = await prisma.user.findUnique({
        where: { githubId: author.githubId },
      });
    }
    if (!user && author.email) {
      user = await prisma.user.findFirst({
        where: { email: author.email },
      });
    }
    if (!user && author.login) {
      user = await prisma.user.findFirst({
        where: { nickname: author.login },
      });
    }

    if (!user) {
      unsigned.push(author);
      continue;
    }

    // Check for non-revoked signature on this agreement
    const signature = await prisma.signature.findUnique({
      where: {
        userId_agreementId: { userId: user.id, agreementId },
      },
    });

    if (signature && !signature.revokedAt) {
      signed.push(author);
    } else {
      unsigned.push(author);
    }
  }

  return { allSigned: unsigned.length === 0, signed, unsigned, excluded };
}

// ---------------------------------------------------------------------------
// Check run creation
// ---------------------------------------------------------------------------

export async function createCheckRun(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  owner: string,
  repo: string,
  headSha: string,
  result: CheckResult,
  agreementOwner: string,
  agreementRepo: string | null,
) {
  const detailsUrl = `${APP_URL}/agreements/${agreementOwner}/${agreementRepo}`;
  const conclusion = result.allSigned ? "success" : "action_required";

  let summary: string;
  if (result.allSigned) {
    summary = "All commit authors have signed the CLA.";
  } else {
    const unsignedList = result.unsigned
      .map((a) => `- ${a.login ?? a.email ?? "Unknown"}`)
      .join("\n");
    summary = [
      "The following commit authors have **not** signed the CLA:",
      "",
      unsignedList,
      "",
      `Please [sign the CLA](${detailsUrl}) to get this check to pass.`,
    ].join("\n");
  }

  if (result.signed.length > 0) {
    const signedList = result.signed
      .map((a) => `- ${a.login ?? a.email ?? "Unknown"}`)
      .join("\n");
    summary += `\n\n**Signed:**\n${signedList}`;
  }

  if (result.excluded.length > 0) {
    const excludedList = result.excluded
      .map((a) => `- ${a.login ?? a.email ?? "Unknown"}`)
      .join("\n");
    summary += `\n\n**Excluded (bots/bypassed):**\n${excludedList}`;
  }

  await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner,
    repo,
    name: "CLAHub",
    head_sha: headSha,
    status: "completed",
    conclusion,
    details_url: detailsUrl,
    output: {
      title: result.allSigned
        ? "All authors have signed the CLA"
        : `${result.unsigned.length} author(s) need to sign the CLA`,
      summary,
    },
  });
}

// ---------------------------------------------------------------------------
// Author extraction
// ---------------------------------------------------------------------------

export async function extractPRAuthors(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<AuthorInfo[]> {
  const { data: commits } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
    { owner, repo, pull_number: pullNumber },
  );

  const seen = new Set<string>();
  const authors: AuthorInfo[] = [];

  for (const commit of commits) {
    const githubId = commit.author?.id ? String(commit.author.id) : null;
    const login = commit.author?.login ?? null;
    const email = commit.committer?.login === "web-flow"
      ? commit.commit.author?.email ?? null
      : commit.commit.author?.email ?? null;

    const key = githubId ?? email ?? login ?? "";
    if (!key || seen.has(key)) continue;
    seen.add(key);

    authors.push({ githubId, login, email });
  }

  return authors;
}

export function extractPushAuthors(
  commits: Array<{
    distinct?: boolean;
    author: { username?: string | null; email?: string | null };
  }>,
): AuthorInfo[] {
  const seen = new Set<string>();
  const authors: AuthorInfo[] = [];

  for (const commit of commits) {
    if (commit.distinct === false) continue;

    const login = commit.author.username ?? null;
    const email = commit.author.email ?? null;

    const key = login ?? email ?? "";
    if (!key || seen.has(key)) continue;
    seen.add(key);

    authors.push({ githubId: null, login, email });
  }

  return authors;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 1000 } = {},
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      const delay = baseDelayMs * 2 ** i;
      logger.warn(`Retry ${i + 1}/${attempts - 1} after ${delay}ms`, { action: "cla-check.retry" });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

// ---------------------------------------------------------------------------
// Recheck open PRs (called after a new signature)
// ---------------------------------------------------------------------------

export async function recheckOpenPRs(agreementId: number): Promise<void> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
  });

  if (!agreement || !agreement.installationId || agreement.deletedAt) return;

  const octokit = await getInstallationOctokit(
    Number(agreement.installationId),
  );
  const owner = agreement.ownerName;
  const repo = agreement.repoName!;

  const { data: pulls } = await withRetry(() =>
    octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state: "open",
      per_page: 100,
    }),
  );

  logger.info(`Rechecking ${pulls.length} open PR(s) for ${owner}/${repo}`, { action: "cla-check.recheck" });

  for (const pr of pulls) {
    const start = Date.now();
    try {
      const authors = await withRetry(() =>
        extractPRAuthors(octokit, owner, repo, pr.number),
      );
      const result = await checkClaForCommitAuthors(agreement.id, authors);
      await withRetry(() =>
        createCheckRun(
          octokit, owner, repo, pr.head.sha,
          result, owner, agreement.repoName,
        ),
      );
      const duration = Date.now() - start;
      logger.info(
        `PR #${pr.number}: ${result.allSigned ? "success" : "action_required"} (${duration}ms)`,
        { action: "cla-check.recheck" },
      );
    } catch (err) {
      const duration = Date.now() - start;
      logger.error(
        `PR #${pr.number}: failed after retries (${duration}ms)`,
        { action: "cla-check.recheck" },
        err,
      );
    }
  }
}
