import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
	auth: vi.fn(),
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		agreement: { findUnique: vi.fn() },
	},
}));

vi.mock("@/lib/cla-check", () => ({
	recheckOpenPRs: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
	getInstallationOctokit: vi.fn(),
	getGitHubApp: vi.fn(),
}));

import { recheckAgreementPRs } from "@/lib/actions/recheck";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recheckOpenPRs } from "@/lib/cla-check";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);
const mockRecheckOpenPRs = vi.mocked(recheckOpenPRs);

function mockSession(userId = "1") {
	mockAuth.mockResolvedValue({
		user: { id: userId, role: "owner", nickname: "owner1" },
		expires: "9999-01-01",
	} as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

const fakeAgreement = {
	id: 1,
	ownerId: 1,
	ownerName: "org",
	repoName: "repo",
	scope: "repo",
	installationId: "12345",
	deletedAt: null,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("recheckAgreementPRs", () => {
	it("returns error when not authenticated", async () => {
		mockAuth.mockResolvedValue(null);
		const result = await recheckAgreementPRs({ agreementId: 1 });
		expect(result).toEqual({ success: false, error: "Not authenticated" });
	});

	it("returns error when agreement not found", async () => {
		mockSession();
		mockPrisma.agreement.findUnique.mockResolvedValue(null);
		const result = await recheckAgreementPRs({ agreementId: 999 });
		expect(result).toEqual({ success: false, error: "Agreement not found" });
	});

	it("returns error when user is not the owner", async () => {
		mockSession("99");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		const result = await recheckAgreementPRs({ agreementId: 1 });
		expect(result).toEqual({ success: false, error: "Not the agreement owner" });
	});

	it("returns error when no installation ID", async () => {
		mockSession();
		mockPrisma.agreement.findUnique.mockResolvedValue({
			...fakeAgreement,
			installationId: null,
		} as any);
		const result = await recheckAgreementPRs({ agreementId: 1 });
		expect(result.success).toBe(false);
		expect(result).toHaveProperty("error");
	});

	it("returns error for org-scope agreements", async () => {
		mockSession();
		mockPrisma.agreement.findUnique.mockResolvedValue({
			...fakeAgreement,
			scope: "org",
		} as any);
		const result = await recheckAgreementPRs({ agreementId: 1 });
		expect(result.success).toBe(false);
	});

	it("returns success with recheck results", async () => {
		mockSession();
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockRecheckOpenPRs.mockResolvedValue({ checked: 3, updated: 2 });

		const result = await recheckAgreementPRs({ agreementId: 1 });

		expect(result).toEqual({
			success: true,
			result: { checked: 3, updated: 2 },
		});
		expect(mockRecheckOpenPRs).toHaveBeenCalledWith(1);
	});

	it("returns error when recheckOpenPRs throws", async () => {
		mockSession();
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockRecheckOpenPRs.mockRejectedValue(new Error("GitHub API error"));

		const result = await recheckAgreementPRs({ agreementId: 1 });

		expect(result).toEqual({
			success: false,
			error: "Re-check failed. Please try again.",
		});
	});
});
