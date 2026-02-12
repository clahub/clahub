import { describe, it, expect, vi, beforeEach } from "vitest";

// Must mock before importing the module
vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

import { getOrgRole, getAdminOrgs } from "@/lib/org-membership";

const TOKEN = "ghp_test_token";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getOrgRole", () => {
  it("returns 'admin' for active admin membership", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ state: "active", role: "admin" }),
    );

    const role = await getOrgRole(TOKEN, "my-org", "alice");
    expect(role).toBe("admin");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/orgs/my-org/memberships/alice",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      }),
    );
  });

  it("returns 'member' for active member membership", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ state: "active", role: "member" }),
    );

    const role = await getOrgRole(TOKEN, "my-org", "bob");
    expect(role).toBe("member");
  });

  it("returns null for pending membership", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ state: "pending", role: "admin" }),
    );

    const role = await getOrgRole(TOKEN, "my-org", "charlie");
    expect(role).toBeNull();
  });

  it("returns null on 404 (not a member)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 }),
    );

    const role = await getOrgRole(TOKEN, "my-org", "stranger");
    expect(role).toBeNull();
  });

  it("returns null on 401 (bad token)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    const role = await getOrgRole(TOKEN, "my-org", "alice");
    expect(role).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const role = await getOrgRole(TOKEN, "my-org", "alice");
    expect(role).toBeNull();
  });
});

describe("getAdminOrgs", () => {
  it("returns org logins where user is admin", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json([
        { organization: { login: "org-a" }, role: "admin" },
        { organization: { login: "org-b" }, role: "member" },
        { organization: { login: "org-c" }, role: "admin" },
      ]),
    );

    const orgs = await getAdminOrgs(TOKEN);
    expect(orgs).toEqual(["org-a", "org-c"]);
  });

  it("paginates through multiple pages", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      organization: { login: `org-${i}` },
      role: i < 2 ? "admin" : "member",
    }));
    const page2 = [
      { organization: { login: "org-100" }, role: "admin" },
    ];

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(page1))
      .mockResolvedValueOnce(Response.json(page2));

    const orgs = await getAdminOrgs(TOKEN);
    expect(orgs).toEqual(["org-0", "org-1", "org-100"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns empty array on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    const orgs = await getAdminOrgs(TOKEN);
    expect(orgs).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const orgs = await getAdminOrgs(TOKEN);
    expect(orgs).toEqual([]);
  });
});
