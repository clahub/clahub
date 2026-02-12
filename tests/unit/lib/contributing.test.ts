import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing module under test
vi.mock("@/lib/github", () => ({
	getInstallationOctokit: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { checkContributingMd } from "@/lib/actions/contributing";
import { buildContributingCreateUrl } from "@/lib/contributing";
import { getInstallationOctokit } from "@/lib/github";

const mockGetInstallationOctokit = vi.mocked(getInstallationOctokit);

function mockOctokit(response: unknown) {
	mockGetInstallationOctokit.mockResolvedValue({
		request: vi.fn().mockResolvedValue({ data: response }),
	} as any);
}

function mockOctokitError(status: number) {
	const err = new Error("Not Found") as Error & { status: number };
	err.status = status;
	mockGetInstallationOctokit.mockResolvedValue({
		request: vi.fn().mockRejectedValue(err),
	} as any);
}

describe("checkContributingMd", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns exists: false when installationId is null", async () => {
		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: null,
		});
		expect(result).toEqual({ exists: false });
		expect(mockGetInstallationOctokit).not.toHaveBeenCalled();
	});

	it("returns exists: true with htmlUrl when file exists", async () => {
		mockOctokit({
			html_url: "https://github.com/org/repo/blob/main/CONTRIBUTING.md",
		});

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: "123",
		});

		expect(result).toEqual({
			exists: true,
			htmlUrl: "https://github.com/org/repo/blob/main/CONTRIBUTING.md",
		});
		expect(mockGetInstallationOctokit).toHaveBeenCalledWith(123);
	});

	it("returns exists: false when file is not found (404)", async () => {
		mockOctokitError(404);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: "123",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false when API returns array (directory)", async () => {
		mockOctokit([{ name: "something" }]);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: "123",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false when html_url is null", async () => {
		mockOctokit({ html_url: null });

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: "123",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false on non-404 errors", async () => {
		mockOctokitError(500);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
			installationId: "123",
		});

		expect(result).toEqual({ exists: false });
	});
});

describe("buildContributingCreateUrl", () => {
	it("returns a GitHub new-file URL", () => {
		const url = buildContributingCreateUrl("my-org", "my-repo");
		expect(url).toContain(
			"https://github.com/my-org/my-repo/new/main?filename=CONTRIBUTING.md",
		);
		expect(url).toContain("&value=");
	});

	it("includes the signing URL in the template", () => {
		const url = buildContributingCreateUrl("my-org", "my-repo");
		const value = decodeURIComponent(url.split("&value=")[1]);
		expect(value).toContain("/agreements/my-org/my-repo");
	});

	it("includes the repo name in the heading", () => {
		const url = buildContributingCreateUrl("acme", "widget");
		const value = decodeURIComponent(url.split("&value=")[1]);
		expect(value).toContain("# Contributing to acme/widget");
	});

	it("encodes the template value for URL safety", () => {
		const url = buildContributingCreateUrl("org", "repo");
		// The part after &value= should be URL-encoded (no raw newlines)
		const valuePart = url.split("&value=")[1];
		expect(valuePart).not.toContain("\n");
	});
});
