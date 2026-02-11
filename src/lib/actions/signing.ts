"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSigningSchema, type SerializedField } from "@/lib/schemas/signing";
import { recheckOpenPRs } from "@/lib/cla-check";

type ActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export async function signAgreement(input: {
  agreementId: number;
  fields: Record<string, string | boolean>;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be signed in to sign this agreement" };
  }

  const userId = parseInt(session.user.id, 10);

  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!agreement || agreement.deletedAt) {
    return { success: false, error: "Agreement not found" };
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return { success: false, error: "Agreement has no published version" };
  }

  // Build and validate fields server-side
  const serializedFields: SerializedField[] = agreement.fields.map((f) => ({
    id: f.id,
    label: f.label,
    dataType: f.dataType as SerializedField["dataType"],
    required: f.required,
    description: f.description,
    sortOrder: f.sortOrder,
  }));

  const schema = buildSigningSchema(serializedFields);
  const parsed = schema.safeParse(input.fields);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  // Check for existing signature
  const existingSignature = await prisma.signature.findUnique({
    where: {
      userId_agreementId: { userId, agreementId: agreement.id },
    },
  });

  if (existingSignature && !existingSignature.revokedAt) {
    return { success: false, error: "You have already signed this agreement" };
  }

  const ipAddress = await getClientIp();

  try {
    await prisma.$transaction(async (tx) => {
      const signature = await tx.signature.create({
        data: {
          userId,
          agreementId: agreement.id,
          versionId: latestVersion.id,
          source: "online",
          ipAddress,
        },
      });

      // Create field entries
      const fieldEntries = agreement.fields.map((f) => ({
        signatureId: signature.id,
        fieldId: f.id,
        value:
          f.dataType === "checkbox"
            ? String(input.fields[`field_${f.id}`] ?? false)
            : String(input.fields[`field_${f.id}`] ?? ""),
      }));

      if (fieldEntries.length > 0) {
        await tx.fieldEntry.createMany({ data: fieldEntries });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "signature.create",
          entityType: "Signature",
          entityId: signature.id,
          after: JSON.stringify({
            agreementId: agreement.id,
            versionId: latestVersion.id,
            version: latestVersion.version,
            fieldsCount: fieldEntries.length,
          }),
        },
      });
    });
  } catch (error) {
    // Handle unique constraint violation (race condition)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "You have already signed this agreement" };
    }
    throw error;
  }

  // Trigger async re-check of open PRs (stub — #211/#212)
  recheckOpenPRs(agreement.id).catch(() => {
    // Fire-and-forget; errors are non-critical
  });

  return { success: true };
}

