"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recheckOpenPRs, type RecheckResult } from "@/lib/cla-check";

type RecheckResponse =
  | { success: true; result: RecheckResult }
  | { success: false; error: string };

export async function recheckAgreementPRs(input: {
  agreementId: number;
}): Promise<RecheckResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const userId = parseInt(session.user.id, 10);
  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
  });

  if (!agreement || agreement.deletedAt) {
    return { success: false, error: "Agreement not found" };
  }

  if (agreement.ownerId !== userId) {
    return { success: false, error: "Not the agreement owner" };
  }

  if (!agreement.installationId) {
    return { success: false, error: "GitHub App not installed for this agreement" };
  }

  if (agreement.scope === "org") {
    return { success: false, error: "PR re-check is not available for org-wide agreements" };
  }

  try {
    const result = await recheckOpenPRs(agreement.id);
    return { success: true, result };
  } catch {
    return { success: false, error: "Re-check failed. Please try again." };
  }
}
