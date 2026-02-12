import { cache } from "react";

const GITHUB_API = "https://api.github.com";

type OrgRole = "admin" | "member" | null;

/**
 * Check a user's role within a GitHub organization.
 * Returns "admin", "member", or null (not a member / error).
 */
export const getOrgRole = cache(
  async (
    accessToken: string,
    orgLogin: string,
    username: string,
  ): Promise<OrgRole> => {
    try {
      const res = await fetch(
        `${GITHUB_API}/orgs/${encodeURIComponent(orgLogin)}/memberships/${encodeURIComponent(username)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
          },
          next: { revalidate: 300 },
        },
      );

      if (!res.ok) return null;

      const data = (await res.json()) as { state: string; role: string };
      if (data.state !== "active") return null;

      return data.role === "admin" ? "admin" : "member";
    } catch {
      return null;
    }
  },
);

/**
 * Get the list of org logins where the user is an active admin.
 */
export const getAdminOrgs = cache(
  async (accessToken: string): Promise<string[]> => {
    const orgs: string[] = [];
    let page = 1;

    try {
      while (true) {
        const res = await fetch(
          `${GITHUB_API}/user/memberships/orgs?state=active&per_page=100&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github+json",
            },
            next: { revalidate: 300 },
          },
        );

        if (!res.ok) break;

        const data = (await res.json()) as {
          organization: { login: string };
          role: string;
        }[];

        if (data.length === 0) break;

        for (const membership of data) {
          if (membership.role === "admin") {
            orgs.push(membership.organization.login);
          }
        }

        if (data.length < 100) break;
        page++;
      }
    } catch {
      // Return whatever we've collected so far
    }

    return orgs;
  },
);
