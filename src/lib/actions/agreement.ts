"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";
import {
  createAgreementSchema,
  updateAgreementSchema,
  deleteAgreementSchema,
} from "@/lib/schemas/agreement";
import {
  type ActionResult,
  requireOwner,
  validationError,
} from "./result";

interface InstallationRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
}

export interface Installation {
  id: number;
  account: string;
  repos: InstallationRepo[];
}

export async function fetchInstallationRepos(): Promise<Installation[]> {
  const user = await requireOwner();
  if (!user.accessToken) {
    return [];
  }

  const installationsRes = await fetch(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!installationsRes.ok) {
    return [];
  }

  const { installations } = (await installationsRes.json()) as {
    installations: { id: number; account: { login: string } }[];
  };

  const results: Installation[] = [];

  for (const inst of installations) {
    const reposRes = await fetch(
      `https://api.github.com/user/installations/${inst.id}/repositories`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!reposRes.ok) continue;

    const { repositories } = (await reposRes.json()) as {
      repositories: {
        id: number;
        name: string;
        full_name: string;
        owner: { login: string };
      }[];
    };

    results.push({
      id: inst.id,
      account: inst.account.login,
      repos: repositories.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
      })),
    });
  }

  return results;
}

export async function createAgreement(
  input: unknown
): Promise<ActionResult | never> {
  const user = await requireOwner();
  const parsed = createAgreementSchema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const data = parsed.data;

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

  const userId = parseInt(user.id, 10);
  const ipAddress = await getClientIp();

  await prisma.$transaction(async (tx) => {
    const agreement = await tx.agreement.create({
      data: {
        githubRepoId: data.githubRepoId,
        ownerName: data.ownerName,
        repoName: data.repoName,
        installationId: data.installationId ?? null,
        ownerId: userId,
      },
    });

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

    await logAudit(tx, {
      userId,
      action: "agreement.create",
      entityType: "Agreement",
      entityId: agreement.id,
      after: {
        githubRepoId: data.githubRepoId,
        ownerName: data.ownerName,
        repoName: data.repoName,
        fieldsCount: data.fields.length,
      },
      ipAddress,
    });
  });

  redirect("/agreements");
}

export async function updateAgreement(
  input: unknown
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
      data.fields.filter((f) => f.id).map((f) => f.id!)
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
