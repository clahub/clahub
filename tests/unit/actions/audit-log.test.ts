import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
	auth: vi.fn(),
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		agreement: { findUnique: vi.fn() },
		auditLog: { findMany: vi.fn(), count: vi.fn() },
	},
}));

import { getAuditLogs, exportAuditLogsJson } from "@/lib/actions/audit-log";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

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
	deletedAt: null,
};

const fakeLog = {
	id: 10,
	action: "agreement.update",
	entityType: "Agreement",
	entityId: 1,
	before: '{"text":"old"}',
	after: '{"text":"new"}',
	ipAddress: "1.2.3.4",
	createdAt: new Date("2026-01-15T10:00:00Z"),
	userId: 1,
	user: { nickname: "owner1" },
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getAuditLogs", () => {
	it("returns empty when not authenticated", async () => {
		mockAuth.mockResolvedValue(null);
		const result = await getAuditLogs({ agreementId: 1 });
		expect(result.entries).toEqual([]);
		expect(result.total).toBe(0);
	});

	it("returns empty when user is not the owner", async () => {
		mockSession("99");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		const result = await getAuditLogs({ agreementId: 1 });
		expect(result.entries).toEqual([]);
	});

	it("returns paginated audit logs for the owner", async () => {
		mockSession("1");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockPrisma.auditLog.findMany.mockResolvedValue([fakeLog] as any);
		mockPrisma.auditLog.count.mockResolvedValue(1);

		const result = await getAuditLogs({ agreementId: 1, page: 1, pageSize: 20 });

		expect(result.entries).toHaveLength(1);
		expect(result.entries[0].action).toBe("agreement.update");
		expect(result.entries[0].user?.nickname).toBe("owner1");
		expect(result.total).toBe(1);
		expect(result.page).toBe(1);
	});

	it("applies action filter", async () => {
		mockSession("1");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockPrisma.auditLog.findMany.mockResolvedValue([]);
		mockPrisma.auditLog.count.mockResolvedValue(0);

		await getAuditLogs({ agreementId: 1, actionFilter: "signature.sign" });

		expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ action: "signature.sign" }),
			}),
		);
	});

	it("clamps page and pageSize to valid ranges", async () => {
		mockSession("1");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockPrisma.auditLog.findMany.mockResolvedValue([]);
		mockPrisma.auditLog.count.mockResolvedValue(0);

		const result = await getAuditLogs({ agreementId: 1, page: -5, pageSize: 999 });

		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(100);
	});
});

describe("exportAuditLogsJson", () => {
	it("returns error when not authenticated", async () => {
		mockAuth.mockResolvedValue(null);
		const result = await exportAuditLogsJson({ agreementId: 1 });
		expect(result.success).toBe(false);
	});

	it("returns error when user is not the owner", async () => {
		mockSession("99");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		const result = await exportAuditLogsJson({ agreementId: 1 });
		expect(result.success).toBe(false);
	});

	it("returns valid JSON string for the owner", async () => {
		mockSession("1");
		mockPrisma.agreement.findUnique.mockResolvedValue(fakeAgreement as any);
		mockPrisma.auditLog.findMany.mockResolvedValue([fakeLog] as any);

		const result = await exportAuditLogsJson({ agreementId: 1 });

		expect(result.success).toBe(true);
		if (result.success) {
			const parsed = JSON.parse(result.data);
			expect(parsed).toHaveLength(1);
			expect(parsed[0].action).toBe("agreement.update");
			expect(parsed[0].before).toEqual({ text: "old" });
			expect(parsed[0].after).toEqual({ text: "new" });
		}
	});
});
