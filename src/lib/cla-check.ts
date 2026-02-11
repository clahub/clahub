import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";

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
};

// ---------------------------------------------------------------------------
// CLA verification
// ---------------------------------------------------------------------------

export async function checkClaForCommitAuthors(
  agreementId: number,
  authors: AuthorInfo[],
): Promise<CheckResult> {
  const signed: AuthorInfo[] = [];
  const unsigned: AuthorInfo[] = [];

  for (const author of authors) {
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

  return { allSigned: unsigned.length === 0, signed, unsigned };
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

  const { data: pulls } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls",
    {
      owner: agreement.ownerName,
      repo: agreement.repoName!,
      state: "open",
      per_page: 100,
    },
  );

  for (const pr of pulls) {
    try {
      const authors = await extractPRAuthors(
        octokit,
        agreement.ownerName,
        agreement.repoName!,
        pr.number,
      );
      const result = await checkClaForCommitAuthors(agreement.id, authors);
      await createCheckRun(
        octokit,
        agreement.ownerName,
        agreement.repoName!,
        pr.head.sha,
        result,
        agreement.ownerName,
        agreement.repoName,
      );
    } catch (err) {
      console.error(
        `Failed to recheck PR #${pr.number} for agreement ${agreementId}:`,
        err,
      );
    }
  }
}
