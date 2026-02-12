import { auth } from "@/lib/auth";
import { getOrgRole } from "@/lib/org-membership";

export type AccessLevel = "owner" | "org_admin" | "none";

/**
 * Determine the current user's access level for a given agreement.
 */
export async function getAgreementAccessLevel(
  agreementOwnerId: number,
  agreementOwnerName: string,
): Promise<{ level: AccessLevel; userId: number | null }> {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return { level: "none", userId: null };
  }

  const userId = parseInt(session.user.id, 10);

  if (agreementOwnerId === userId) {
    return { level: "owner", userId };
  }

  const accessToken = session.user.accessToken;
  if (accessToken) {
    const role = await getOrgRole(
      accessToken,
      agreementOwnerName,
      session.user.nickname,
    );
    if (role === "admin") {
      return { level: "org_admin", userId };
    }
  }

  return { level: "none", userId };
}
