import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/org-membership", () => ({
  getOrgRole: vi.fn(),
}));

import { getAgreementAccessLevel } from "@/lib/access";
import { auth } from "@/lib/auth";
import { getOrgRole } from "@/lib/org-membership";

const mockedAuth = vi.mocked(auth);
const mockedGetOrgRole = vi.mocked(getOrgRole);

function mockSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "1",
      githubId: "123",
      nickname: "alice",
      role: "owner",
      accessToken: "ghp_test",
      ...overrides,
    },
    expires: new Date().toISOString(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getAgreementAccessLevel", () => {
  it("returns 'owner' when user owns the agreement", async () => {
    mockedAuth.mockResolvedValue(mockSession() as never);

    const result = await getAgreementAccessLevel(1, "alice");
    expect(result).toEqual({ level: "owner", userId: 1 });
    expect(mockedGetOrgRole).not.toHaveBeenCalled();
  });

  it("returns 'org_admin' when user is org admin", async () => {
    mockedAuth.mockResolvedValue(mockSession({ id: "2" }) as never);
    mockedGetOrgRole.mockResolvedValue("admin");

    const result = await getAgreementAccessLevel(1, "my-org");
    expect(result).toEqual({ level: "org_admin", userId: 2 });
    expect(mockedGetOrgRole).toHaveBeenCalledWith(
      "ghp_test",
      "my-org",
      "alice",
    );
  });

  it("returns 'none' when user is org member but not admin", async () => {
    mockedAuth.mockResolvedValue(mockSession({ id: "2" }) as never);
    mockedGetOrgRole.mockResolvedValue("member");

    const result = await getAgreementAccessLevel(1, "my-org");
    expect(result).toEqual({ level: "none", userId: 2 });
  });

  it("returns 'none' when no session", async () => {
    mockedAuth.mockResolvedValue(null as never);

    const result = await getAgreementAccessLevel(1, "my-org");
    expect(result).toEqual({ level: "none", userId: null });
  });

  it("returns 'none' for contributor role", async () => {
    mockedAuth.mockResolvedValue(
      mockSession({ role: "contributor" }) as never,
    );

    const result = await getAgreementAccessLevel(1, "my-org");
    expect(result).toEqual({ level: "none", userId: null });
  });

  it("returns 'none' when no access token", async () => {
    mockedAuth.mockResolvedValue(
      mockSession({ id: "2", accessToken: null }) as never,
    );

    const result = await getAgreementAccessLevel(1, "my-org");
    expect(result).toEqual({ level: "none", userId: 2 });
    expect(mockedGetOrgRole).not.toHaveBeenCalled();
  });

  it("owner check takes priority over org admin", async () => {
    mockedAuth.mockResolvedValue(mockSession() as never);

    const result = await getAgreementAccessLevel(1, "alice");
    expect(result).toEqual({ level: "owner", userId: 1 });
    // Should not even call getOrgRole since owner check wins
    expect(mockedGetOrgRole).not.toHaveBeenCalled();
  });
});
