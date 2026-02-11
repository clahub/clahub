"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExclusionSchema,
  deleteExclusionSchema,
} from "@/lib/schemas/exclusion";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function addExclusion(input: unknown): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = createExclusionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const data = parsed.data;
  const userId = parseInt(user.id, 10);

  const agreement = await prisma.agreement.findUnique({
    where: { id: data.agreementId },
  });

  if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
    return { success: false, error: "Agreement not found" };
  }

  // Prevent duplicate bot_auto exclusions
  if (data.type === "bot_auto") {
    const existing = await prisma.exclusion.findFirst({
      where: { agreementId: data.agreementId, type: "bot_auto" },
    });
    if (existing) {
      return { success: false, error: "Bot auto-detection is already enabled" };
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
      return { success: false, error: "This user is already excluded" };
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

    await tx.auditLog.create({
      data: {
        userId,
        action: "exclusion.create",
        entityType: "Exclusion",
        entityId: data.agreementId,
        after: JSON.stringify({
          type: data.type,
          githubLogin: data.githubLogin ?? null,
        }),
      },
    });
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  return { success: true };
}

export async function removeExclusion(input: unknown): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = deleteExclusionSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const data = parsed.data;
  const userId = parseInt(user.id, 10);

  const agreement = await prisma.agreement.findUnique({
    where: { id: data.agreementId },
  });

  if (!agreement || agreement.ownerId !== userId || agreement.deletedAt) {
    return { success: false, error: "Agreement not found" };
  }

  const exclusion = await prisma.exclusion.findFirst({
    where: { id: data.id, agreementId: data.agreementId },
  });

  if (!exclusion) {
    return { success: false, error: "Exclusion not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.exclusion.delete({ where: { id: data.id } });

    await tx.auditLog.create({
      data: {
        userId,
        action: "exclusion.delete",
        entityType: "Exclusion",
        entityId: data.agreementId,
        before: JSON.stringify({
          type: exclusion.type,
          githubLogin: exclusion.githubLogin,
        }),
      },
    });
  });

  revalidatePath(`/agreements/edit/${data.agreementId}`);
  return { success: true };
}
