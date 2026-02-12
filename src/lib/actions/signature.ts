"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";
import {
  addManualSignatureSchema,
  importCsvSignaturesSchema,
} from "@/lib/schemas/signature";
import { recheckOpenPRs } from "@/lib/cla-check";
import { type ActionResult, requireOwner } from "./result";

export type ImportResult =
  | {
      success: true;
      imported: number;
      skipped: number;
      errors: Array<{ row: number; reason: string }>;
    }
  | { success: false; error: string; code?: string };

// ---------------------------------------------------------------------------
// Resolve or create a User from GitHub login or email
// ---------------------------------------------------------------------------

async function resolveOrCreateUser(
  accessToken: string,
  opts: { githubLogin?: string; email?: string; name?: string },
): Promise<{ userId: number } | { error: string }> {
  if (opts.githubLogin) {
    // Look up GitHub user via API using the owner's access token
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(opts.githubLogin)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) {
      return { error: `GitHub user "${opts.githubLogin}" not found` };
    }

    const profile = (await res.json()) as {
      id: number;
      login: string;
      avatar_url: string;
      email?: string | null;
      name?: string | null;
    };

    const githubId = String(profile.id);
    const user = await prisma.user.upsert({
      where: { githubId },
      create: {
        githubId,
        nickname: profile.login,
        email: profile.email ?? opts.email ?? null,
        name: profile.name ?? opts.name ?? null,
        avatarUrl: profile.avatar_url ?? null,
        role: "contributor",
      },
      update: {
        nickname: profile.login,
        avatarUrl: profile.avatar_url ?? null,
      },
    });

    return { userId: user.id };
  }

  if (opts.email) {
    // Try to find existing user by email
    const existing = await prisma.user.findFirst({
      where: { email: opts.email },
    });

    if (existing) {
      return { userId: existing.id };
    }

    // Create stub user with synthetic githubId
    const user = await prisma.user.create({
      data: {
        githubId: `email:${opts.email}`,
        nickname: opts.email.split("@")[0],
        email: opts.email,
        name: opts.name ?? null,
        role: "contributor",
      },
    });

    return { userId: user.id };
  }

  return { error: "Either GitHub username or email is required" };
}

// ---------------------------------------------------------------------------
// Add a single manual signature
// ---------------------------------------------------------------------------

export async function addManualSignature(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = addManualSignatureSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
      code: "VALIDATION_ERROR",
    };
  }

  const data = parsed.data;
  const userId = parseInt(user.id, 10);
  const ipAddress = await getClientIp();

  const agreement = await prisma.agreement.findUnique({
    where: { id: data.agreementId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
    return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return {
      success: false,
      error: "Agreement has no published version",
      code: "NOT_FOUND",
    };
  }

  // Resolve the target user
  const accessToken = user.accessToken;
  if (!accessToken) {
    return {
      success: false,
      error: "Missing GitHub access token — please re-authenticate",
      code: "UNAUTHORIZED",
    };
  }

  const resolved = await resolveOrCreateUser(accessToken, {
    githubLogin: data.githubLogin,
    email: data.email,
    name: data.name,
  });

  if ("error" in resolved) {
    return { success: false, error: resolved.error, code: "NOT_FOUND" };
  }

  // Check for existing non-revoked signature
  const existing = await prisma.signature.findUnique({
    where: {
      userId_agreementId: {
        userId: resolved.userId,
        agreementId: agreement.id,
      },
    },
  });

  if (existing && !existing.revokedAt) {
    return {
      success: false,
      error: "This user has already signed this agreement",
      code: "CONFLICT",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.signature.create({
      data: {
        userId: resolved.userId,
        agreementId: agreement.id,
        versionId: latestVersion.id,
        source: "manual",
        signedAt: data.signedAt ? new Date(data.signedAt) : new Date(),
        ipAddress: null,
      },
    });

    await logAudit(tx, {
      userId,
      action: "signature.manual_add",
      entityType: "Signature",
      entityId: agreement.id,
      after: {
        targetUserId: resolved.userId,
        githubLogin: data.githubLogin ?? null,
        email: data.email ?? null,
        source: "manual",
      },
      ipAddress,
    });
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  recheckOpenPRs(data.agreementId).catch(() => {});
  return { success: true };
}

// ---------------------------------------------------------------------------
// Import signatures from CSV
// ---------------------------------------------------------------------------

export async function importCsvSignatures(
  input: unknown,
): Promise<ImportResult> {
  const user = await requireOwner();
  const parsed = importCsvSignaturesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
      code: "VALIDATION_ERROR",
    };
  }

  const data = parsed.data;
  const ownerId = parseInt(user.id, 10);
  const ipAddress = await getClientIp();

  const agreement = await prisma.agreement.findUnique({
    where: { id: data.agreementId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!agreement || agreement.ownerId !== ownerId || agreement.deletedAt) {
    return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return {
      success: false,
      error: "Agreement has no published version",
      code: "NOT_FOUND",
    };
  }

  const accessToken = user.accessToken;
  if (!accessToken) {
    return {
      success: false,
      error: "Missing GitHub access token — please re-authenticate",
      code: "UNAUTHORIZED",
    };
  }

  // Phase 1: resolve all users (outside transaction for GitHub API calls)
  const resolved: Array<{
    row: number;
    userId?: number;
    error?: string;
    signedAt?: string;
  }> = [];
  const seenUserIds = new Set<number>();

  for (let i = 0; i < data.rows.length; i++) {
    const row = data.rows[i];
    const result = await resolveOrCreateUser(accessToken, {
      githubLogin: row.githubLogin,
      email: row.email,
      name: row.name,
    });

    if ("error" in result) {
      resolved.push({ row: i + 1, error: result.error });
    } else if (seenUserIds.has(result.userId)) {
      resolved.push({ row: i + 1, error: "Duplicate entry in CSV" });
    } else {
      seenUserIds.add(result.userId);
      resolved.push({
        row: i + 1,
        userId: result.userId,
        signedAt: row.signedAt,
      });
    }
  }

  // Phase 2: create signatures in a single transaction
  let imported = 0;
  let skipped = 0;
  const errors: Array<{ row: number; reason: string }> = [];

  const toCreate = resolved.filter(
    (r): r is { row: number; userId: number; signedAt?: string } =>
      r.userId !== undefined,
  );

  // Collect errors from phase 1
  for (const r of resolved) {
    if (r.error) {
      errors.push({ row: r.row, reason: r.error });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of toCreate) {
      // Check for existing non-revoked signature
      const existing = await tx.signature.findUnique({
        where: {
          userId_agreementId: {
            userId: entry.userId,
            agreementId: agreement.id,
          },
        },
      });

      if (existing && !existing.revokedAt) {
        skipped++;
        continue;
      }

      await tx.signature.create({
        data: {
          userId: entry.userId,
          agreementId: agreement.id,
          versionId: latestVersion.id,
          source: "imported",
          signedAt: entry.signedAt ? new Date(entry.signedAt) : new Date(),
          ipAddress: null,
        },
      });

      await logAudit(tx, {
        userId: ownerId,
        action: "signature.csv_import",
        entityType: "Signature",
        entityId: agreement.id,
        after: {
          targetUserId: entry.userId,
          source: "imported",
        },
        ipAddress,
      });

      imported++;
    }
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  recheckOpenPRs(data.agreementId).catch(() => {});

  return { success: true, imported, skipped, errors };
}
