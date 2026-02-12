"use server";

import { logger } from "@/lib/logger";

export type ContributingMdResult =
  | { exists: true; htmlUrl: string }
  | { exists: false };

export async function checkContributingMd(input: {
  ownerName: string;
  repoName: string;
}): Promise<ContributingMdResult> {
  const { ownerName, repoName } = input;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(ownerName)}/${encodeURIComponent(repoName)}/contents/CONTRIBUTING.md`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 },
      },
    );

    if (res.status === 404) {
      return { exists: false };
    }

    if (!res.ok) {
      logger.warn("Failed to check CONTRIBUTING.md", {
        action: "contributing.check",
        ownerName,
        repoName,
        status: res.status,
      });
      return { exists: false };
    }

    const data = await res.json();
    const htmlUrl =
      !Array.isArray(data) && data.html_url ? data.html_url : null;

    return htmlUrl
      ? { exists: true, htmlUrl }
      : { exists: false };
  } catch (err) {
    logger.warn("Failed to check CONTRIBUTING.md", {
      action: "contributing.check",
      ownerName,
      repoName,
      error: err instanceof Error ? err.message : String(err),
    });
    return { exists: false };
  }
}
