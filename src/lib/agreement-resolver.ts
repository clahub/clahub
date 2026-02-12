import { prisma } from "@/lib/prisma";
import type { Agreement } from "@/generated/prisma/client";

/**
 * Finds the agreement that applies to a given repository.
 * Checks for a repo-specific agreement first, then falls back to an org-wide agreement.
 */
export async function findAgreementForRepo(
  repoId: string,
  ownerId: string,
): Promise<Agreement | null> {
  // Repo-specific agreement takes priority
  const repoAgreement = await prisma.agreement.findFirst({
    where: { githubRepoId: repoId, deletedAt: null },
  });

  if (repoAgreement) return repoAgreement;

  // Fall back to org-wide agreement
  return prisma.agreement.findFirst({
    where: { githubOrgId: ownerId, scope: "org", deletedAt: null },
  });
}
