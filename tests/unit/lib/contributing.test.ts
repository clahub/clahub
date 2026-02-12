import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { checkContributingMd } from "@/lib/actions/contributing";
import { buildContributingCreateUrl } from "@/lib/contributing";

const fetchSpy = vi.spyOn(globalThis, "fetch");

describe("checkContributingMd", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns exists: true with htmlUrl when file exists", async () => {
		fetchSpy.mockResolvedValue(
			new Response(
				JSON.stringify({
					html_url:
						"https://github.com/org/repo/blob/main/CONTRIBUTING.md",
				}),
				{ status: 200 },
			),
		);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({
			exists: true,
			htmlUrl: "https://github.com/org/repo/blob/main/CONTRIBUTING.md",
		});
		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.github.com/repos/org/repo/contents/CONTRIBUTING.md",
			expect.objectContaining({
				headers: { Accept: "application/vnd.github.v3+json" },
			}),
		);
	});

	it("returns exists: false when file is not found (404)", async () => {
		fetchSpy.mockResolvedValue(new Response("Not Found", { status: 404 }));

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false when API returns array (directory)", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify([{ name: "something" }]), { status: 200 }),
		);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false when html_url is null", async () => {
		fetchSpy.mockResolvedValue(
			new Response(JSON.stringify({ html_url: null }), { status: 200 }),
		);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false on server errors", async () => {
		fetchSpy.mockResolvedValue(
			new Response("Internal Server Error", { status: 500 }),
		);

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({ exists: false });
	});

	it("returns exists: false on network errors", async () => {
		fetchSpy.mockRejectedValue(new Error("network failure"));

		const result = await checkContributingMd({
			ownerName: "org",
			repoName: "repo",
		});

		expect(result).toEqual({ exists: false });
	});

	it("URL-encodes owner and repo names", async () => {
		fetchSpy.mockResolvedValue(new Response("Not Found", { status: 404 }));

		await checkContributingMd({
			ownerName: "my org",
			repoName: "my repo",
		});

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.github.com/repos/my%20org/my%20repo/contents/CONTRIBUTING.md",
			expect.anything(),
		);
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
		const valuePart = url.split("&value=")[1];
		expect(valuePart).not.toContain("\n");
	});
});
