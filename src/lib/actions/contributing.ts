"use server";

import { getInstallationOctokit } from "@/lib/github";
import { logger } from "@/lib/logger";

export type ContributingMdResult =
  | { exists: true; htmlUrl: string }
  | { exists: false };

export async function checkContributingMd(input: {
  ownerName: string;
  repoName: string;
  installationId: string | null;
}): Promise<ContributingMdResult> {
  const { ownerName, repoName, installationId } = input;

  if (!installationId) {
    return { exists: false };
  }

  try {
    const octokit = await getInstallationOctokit(Number(installationId));
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner: ownerName, repo: repoName, path: "CONTRIBUTING.md" },
    );

    const htmlUrl =
      !Array.isArray(data) && data.html_url ? data.html_url : null;

    return htmlUrl
      ? { exists: true, htmlUrl }
      : { exists: false };
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as Record<string, unknown>).status === 404) {
      return { exists: false };
    }
    logger.warn("Failed to check CONTRIBUTING.md", {
      action: "contributing.check",
      ownerName,
      repoName,
    });
    return { exists: false };
  }
}
