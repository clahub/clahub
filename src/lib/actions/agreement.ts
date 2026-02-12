"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getClientIp, logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
	createAgreementSchema,
	deleteAgreementSchema,
	transferAgreementSchema,
	updateAgreementSchema,
	updateNotificationSchema,
} from "@/lib/schemas/agreement";
import { getAppOctokit, getInstallationOctokit } from "@/lib/github";
import { logger } from "@/lib/logger";
import { type ActionResult, requireOwner, validationError } from "./result";

interface InstallationRepo {
	id: number;
	name: string;
	fullName: string;
	owner: string;
}

export interface Installation {
	id: number;
	account: string;
	accountId: number;
	accountType: string;
	repos: InstallationRepo[];
}

export async function fetchInstallationRepos(): Promise<Installation[]> {
	const user = await requireOwner();
	if (!user.accessToken) {
		logger.warn("No access token available for fetching installations", {
			action: "agreement.fetch-repos",
			userId: user.id,
		});
		return [];
	}

	const headers = {
		Authorization: `Bearer ${user.accessToken}`,
		Accept: "application/vnd.github+json",
	};

	// Strategy 1: If GitHub App is configured, use App JWT to list
	// installations and filter to accounts the user has access to.
	if (process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY) {
		return fetchViaGitHubApp(user, headers);
	}

	// Strategy 2: Fallback to user's OAuth token to list repos/orgs directly.
	// The installationId will be null — the webhook handler will populate it
	// when the GitHub App is installed later.
	return fetchViaOAuthToken(user, headers);
}

async function fetchViaGitHubApp(
	user: { nickname: string; accessToken?: string | null },
	headers: Record<string, string>,
): Promise<Installation[]> {
	// Build set of accounts the user has access to
	const ownerAccounts = await fetchUserAccounts(user.nickname, headers);

	try {
		const appOctokit = getAppOctokit();
		const { data } = await appOctokit.request("GET /app/installations", {
			per_page: 100,
		});

		const results: Installation[] = [];

		for (const inst of data) {
			const account = inst.account;
			if (!account) continue;

			const accountLogin = "login" in account ? account.login : "";
			if (!accountLogin) continue;

			// Only show installations the authenticated owner has access to
			if (!ownerAccounts.has(accountLogin.toLowerCase())) continue;

			try {
				const installationOctokit = await getInstallationOctokit(inst.id);
				const { data: repoData } = await installationOctokit.request(
					"GET /installation/repositories",
					{ per_page: 100 },
				);

				results.push({
					id: inst.id,
					account: accountLogin,
					accountId: "id" in account ? (account.id as number) : 0,
					accountType: inst.target_type ?? "User",
					repos: repoData.repositories.map((r) => ({
						id: r.id,
						name: r.name,
						fullName: r.full_name,
						owner: r.owner.login,
					})),
				});
			} catch (err) {
				logger.warn("Failed to fetch repos for installation", {
					action: "agreement.fetch-repos",
					installationId: inst.id,
					account: accountLogin,
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}

		return results;
	} catch (err) {
		logger.error("Failed to fetch GitHub App installations", {
			action: "agreement.fetch-repos",
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}
}

async function fetchViaOAuthToken(
	user: { nickname: string },
	headers: Record<string, string>,
): Promise<Installation[]> {
	try {
		// Fetch repos the user has admin access to (needed to set up webhooks)
		const reposRes = await fetch(
			"https://api.github.com/user/repos?per_page=100&affiliation=owner,organization_member&sort=updated",
			{ headers },
		);

		if (!reposRes.ok) {
			logger.warn("Failed to fetch user repos via OAuth", {
				action: "agreement.fetch-repos",
				status: reposRes.status,
			});
			return [];
		}

		const repos = (await reposRes.json()) as {
			id: number;
			name: string;
			full_name: string;
			owner: { login: string; id: number; type: string };
		}[];

		// Also fetch orgs for org-wide agreements
		const orgsRes = await fetch(
			"https://api.github.com/user/orgs?per_page=100",
			{ headers },
		);
		const orgs: { login: string; id: number }[] = orgsRes.ok
			? await orgsRes.json()
			: [];

		// Group repos by owner account
		const accountMap = new Map<
			string,
			{
				accountId: number;
				accountType: string;
				repos: InstallationRepo[];
			}
		>();

		for (const r of repos) {
			const key = r.owner.login.toLowerCase();
			if (!accountMap.has(key)) {
				accountMap.set(key, {
					accountId: r.owner.id,
					accountType: r.owner.type,
					repos: [],
				});
			}
			accountMap.get(key)!.repos.push({
				id: r.id,
				name: r.name,
				fullName: r.full_name,
				owner: r.owner.login,
			});
		}

		// Ensure orgs appear even if no repos were returned for them
		for (const o of orgs) {
			const key = o.login.toLowerCase();
			if (!accountMap.has(key)) {
				accountMap.set(key, {
					accountId: o.id,
					accountType: "Organization",
					repos: [],
				});
			}
		}

		// Convert to Installation[] (id=0 since no GitHub App installation)
		const results: Installation[] = [];
		for (const [, value] of accountMap) {
			const account =
				value.repos[0]?.owner ??
				orgs.find(
					(o) => o.id === value.accountId,
				)?.login ??
				"";
			if (!account) continue;

			results.push({
				id: 0,
				account,
				accountId: value.accountId,
				accountType: value.accountType,
				repos: value.repos,
			});
		}

		return results;
	} catch (err) {
		logger.error("Failed to fetch repos via OAuth token", {
			action: "agreement.fetch-repos",
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}
}

async function fetchUserAccounts(
	nickname: string,
	headers: Record<string, string>,
): Promise<Set<string>> {
	const accounts = new Set<string>();
	accounts.add(nickname.toLowerCase());

	try {
		const reposRes = await fetch(
			"https://api.github.com/user/repos?per_page=100&affiliation=owner,organization_member",
			{ headers },
		);
		if (reposRes.ok) {
			const repos = (await reposRes.json()) as {
				owner: { login: string };
			}[];
			for (const r of repos) {
				accounts.add(r.owner.login.toLowerCase());
			}
		}

		const orgsRes = await fetch(
			"https://api.github.com/user/orgs?per_page=100",
			{ headers },
		);
		if (orgsRes.ok) {
			const orgs = (await orgsRes.json()) as { login: string }[];
			for (const o of orgs) {
				accounts.add(o.login.toLowerCase());
			}
		}
	} catch (err) {
		logger.warn("Failed to fetch user accounts for filtering", {
			action: "agreement.fetch-repos",
			error: err instanceof Error ? err.message : String(err),
		});
	}

	return accounts;
}

export async function createAgreement(
	input: unknown,
): Promise<ActionResult | never> {
	const user = await requireOwner();
	const parsed = createAgreementSchema.safeParse(input);

	if (!parsed.success) {
		return validationError(parsed.error);
	}

	const data = parsed.data;

	// Uniqueness check: repo-specific or org-wide
	if (data.scope === "org") {
		const existing = await prisma.agreement.findFirst({
			where: { githubOrgId: data.githubOrgId, scope: "org", deletedAt: null },
		});
		if (existing) {
			return {
				success: false,
				error: "An org-wide agreement already exists for this organization",
				code: "CONFLICT",
			};
		}
	} else {
		const existing = await prisma.agreement.findUnique({
			where: { githubRepoId: data.githubRepoId },
		});
		if (existing && !existing.deletedAt) {
			return {
				success: false,
				error: "An agreement already exists for this repository",
				code: "CONFLICT",
			};
		}
	}

	const userId = parseInt(user.id, 10);
	const ipAddress = await getClientIp();

	await prisma.$transaction(async (tx) => {
		const agreementData =
			data.scope === "org"
				? {
						scope: "org" as const,
						githubOrgId: data.githubOrgId,
						githubRepoId: null,
						ownerName: data.ownerName,
						repoName: null,
						installationId: data.installationId ?? null,
						ownerId: userId,
					}
				: {
						scope: "repo" as const,
						githubRepoId: data.githubRepoId,
						ownerName: data.ownerName,
						repoName: data.repoName,
						installationId: data.installationId ?? null,
						ownerId: userId,
					};

		const agreement = await tx.agreement.create({ data: agreementData });

		await tx.agreementVersion.create({
			data: {
				agreementId: agreement.id,
				version: 1,
				text: data.text,
			},
		});

		if (data.fields.length > 0) {
			await tx.agreementField.createMany({
				data: data.fields.map((f, i) => ({
					agreementId: agreement.id,
					label: f.label,
					dataType: f.dataType,
					required: f.required,
					description: f.description || null,
					sortOrder: f.sortOrder ?? i,
					enabled: true,
				})),
			});
		}

		const auditAfter =
			data.scope === "org"
				? {
						scope: "org",
						githubOrgId: data.githubOrgId,
						ownerName: data.ownerName,
						fieldsCount: data.fields.length,
					}
				: {
						scope: "repo",
						githubRepoId: data.githubRepoId,
						ownerName: data.ownerName,
						repoName: data.repoName,
						fieldsCount: data.fields.length,
					};

		await logAudit(tx, {
			userId,
			action: "agreement.create",
			entityType: "Agreement",
			entityId: agreement.id,
			after: auditAfter,
			ipAddress,
		});
	});

	redirect("/agreements");
}

export async function updateAgreement(
	input: unknown,
): Promise<ActionResult | never> {
	const user = await requireOwner();
	const parsed = updateAgreementSchema.safeParse(input);

	if (!parsed.success) {
		return validationError(parsed.error);
	}

	const data = parsed.data;
	const userId = parseInt(user.id, 10);
	const ipAddress = await getClientIp();

	const agreement = await prisma.agreement.findUnique({
		where: { id: data.id },
		include: {
			versions: { orderBy: { version: "desc" }, take: 1 },
			fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
		},
	});

	if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
		return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
	}

	await prisma.$transaction(async (tx) => {
		const latestVersion = agreement.versions[0];
		const textChanged = latestVersion?.text !== data.text;

		if (textChanged) {
			const newVersionNum = (latestVersion?.version ?? 0) + 1;
			await tx.agreementVersion.create({
				data: {
					agreementId: agreement.id,
					version: newVersionNum,
					text: data.text,
					changelog: data.changelog || null,
				},
			});
		}

		// Reconcile fields: update existing, create new, disable removed
		const existingFieldIds = new Set(agreement.fields.map((f) => f.id));
		const incomingFieldIds = new Set(
			data.fields.filter((f) => f.id).map((f) => f.id!),
		);

		// Disable removed fields (never hard-delete)
		for (const field of agreement.fields) {
			if (!incomingFieldIds.has(field.id)) {
				await tx.agreementField.update({
					where: { id: field.id },
					data: { enabled: false },
				});
			}
		}

		// Update existing or create new fields
		for (let i = 0; i < data.fields.length; i++) {
			const f = data.fields[i];
			if (f.id && existingFieldIds.has(f.id)) {
				await tx.agreementField.update({
					where: { id: f.id },
					data: {
						label: f.label,
						dataType: f.dataType,
						required: f.required,
						description: f.description || null,
						sortOrder: f.sortOrder ?? i,
						enabled: true,
					},
				});
			} else {
				await tx.agreementField.create({
					data: {
						agreementId: agreement.id,
						label: f.label,
						dataType: f.dataType,
						required: f.required,
						description: f.description || null,
						sortOrder: f.sortOrder ?? i,
						enabled: true,
					},
				});
			}
		}

		await logAudit(tx, {
			userId,
			action: "agreement.update",
			entityType: "Agreement",
			entityId: agreement.id,
			before: {
				text: latestVersion?.text,
				fieldsCount: agreement.fields.length,
			},
			after: {
				text: data.text,
				textChanged,
				fieldsCount: data.fields.length,
				changelog: data.changelog,
			},
			ipAddress,
		});
	});

	redirect("/agreements");
}

export async function deleteAgreement(input: unknown): Promise<ActionResult> {
	const user = await requireOwner();
	const parsed = deleteAgreementSchema.safeParse(input);

	if (!parsed.success) {
		return { success: false, error: "Invalid agreement ID" };
	}

	const userId = parseInt(user.id, 10);
	const ipAddress = await getClientIp();

	const agreement = await prisma.agreement.findUnique({
		where: { id: parsed.data.id },
	});

	if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
		return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
	}

	await prisma.$transaction(async (tx) => {
		await tx.agreement.update({
			where: { id: agreement.id },
			data: { deletedAt: new Date() },
		});

		await logAudit(tx, {
			userId,
			action: "agreement.delete",
			entityType: "Agreement",
			entityId: agreement.id,
			before: {
				githubRepoId: agreement.githubRepoId,
				ownerName: agreement.ownerName,
				repoName: agreement.repoName,
			},
			ipAddress,
		});
	});

	return { success: true };
}

export async function transferAgreement(input: unknown): Promise<ActionResult> {
	const user = await requireOwner();
	const parsed = transferAgreementSchema.safeParse(input);

	if (!parsed.success) {
		return validationError(parsed.error);
	}

	const data = parsed.data;
	const userId = parseInt(user.id, 10);
	const ipAddress = await getClientIp();

	const agreement = await prisma.agreement.findUnique({
		where: { id: data.agreementId },
	});

	if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
		return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
	}

	const targetUser = await prisma.user.findFirst({
		where: { nickname: data.newOwnerLogin, role: "owner" },
	});

	if (!targetUser) {
		return {
			success: false,
			error: `User "${data.newOwnerLogin}" is not registered as an owner on CLAHub`,
		};
	}

	if (targetUser.id === userId) {
		return {
			success: false,
			error: "You already own this agreement",
		};
	}

	await prisma.$transaction(async (tx) => {
		await tx.agreement.update({
			where: { id: agreement.id },
			data: { ownerId: targetUser.id },
		});

		await logAudit(tx, {
			userId,
			action: "agreement.transfer",
			entityType: "Agreement",
			entityId: agreement.id,
			before: {
				ownerId: agreement.ownerId,
				ownerNickname: user.nickname,
			},
			after: {
				ownerId: targetUser.id,
				ownerNickname: targetUser.nickname,
			},
			ipAddress,
		});
	});

	return { success: true };
}

export async function updateNotificationPreference(
	input: unknown,
): Promise<ActionResult> {
	const user = await requireOwner();
	const parsed = updateNotificationSchema.safeParse(input);

	if (!parsed.success) {
		return validationError(parsed.error);
	}

	const data = parsed.data;
	const userId = parseInt(user.id, 10);
	const ipAddress = await getClientIp();

	const agreement = await prisma.agreement.findUnique({
		where: { id: data.agreementId },
	});

	if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
		return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
	}

	await prisma.$transaction(async (tx) => {
		await tx.agreement.update({
			where: { id: agreement.id },
			data: { notifyOnSign: data.notifyOnSign },
		});

		await logAudit(tx, {
			userId,
			action: "agreement.update_notification",
			entityType: "Agreement",
			entityId: agreement.id,
			before: { notifyOnSign: agreement.notifyOnSign },
			after: { notifyOnSign: data.notifyOnSign },
			ipAddress,
		});
	});

	revalidatePath(`/agreements/edit/${data.agreementId}`);
	return { success: true };
}
