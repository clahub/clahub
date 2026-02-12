"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";
import {
  createExclusionSchema,
  deleteExclusionSchema,
} from "@/lib/schemas/exclusion";
import { type ActionResult, requireOwner } from "./result";

export async function addExclusion(input: unknown): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = createExclusionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed", code: "VALIDATION_ERROR" };
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

  // Prevent duplicate bot_auto exclusions
  if (data.type === "bot_auto") {
    const existing = await prisma.exclusion.findFirst({
      where: { agreementId: data.agreementId, type: "bot_auto" },
    });
    if (existing) {
      return { success: false, error: "Bot auto-detection is already enabled", code: "CONFLICT" };
    }
  }

  // Prevent duplicate user exclusions
  if (data.type === "user" && data.githubLogin) {
    const existing = await prisma.exclusion.findFirst({
      where: {
        agreementId: data.agreementId,
        type: "user",
        githubLogin: data.githubLogin,
      },
    });
    if (existing) {
      return { success: false, error: "This user is already excluded", code: "CONFLICT" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.exclusion.create({
      data: {
        agreementId: data.agreementId,
        type: data.type,
        githubLogin: data.githubLogin ?? null,
      },
    });

    await logAudit(tx, {
      userId,
      action: "exclusion.create",
      entityType: "Exclusion",
      entityId: data.agreementId,
      after: {
        type: data.type,
        githubLogin: data.githubLogin ?? null,
      },
      ipAddress,
    });
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  return { success: true };
}

export async function removeExclusion(input: unknown): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = deleteExclusionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
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

  const exclusion = await prisma.exclusion.findFirst({
    where: { id: data.id, agreementId: data.agreementId },
  });

  if (!exclusion) {
    return { success: false, error: "Exclusion not found", code: "NOT_FOUND" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.exclusion.delete({ where: { id: data.id } });

    await logAudit(tx, {
      userId,
      action: "exclusion.delete",
      entityType: "Exclusion",
      entityId: data.agreementId,
      before: {
        type: exclusion.type,
        githubLogin: exclusion.githubLogin,
      },
      ipAddress,
    });
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  return { success: true };
}
