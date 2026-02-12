"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";
import { buildSigningSchema, type SerializedField } from "@/lib/schemas/signing";
import { recheckOpenPRs } from "@/lib/cla-check";
import { notifyNewSignature } from "@/lib/email";
import { type ActionResult, validationError } from "./result";

export async function signAgreement(input: {
  agreementId: number;
  fields: Record<string, string | boolean>;
  signatureType?: "individual" | "corporate";
  companyName?: string;
  companyDomain?: string;
  companyTitle?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "You must be signed in to sign this agreement", code: "UNAUTHORIZED" };
  }

  const userId = parseInt(session.user.id, 10);

  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
      owner: { select: { email: true } },
    },
  });

  if (!agreement || agreement.deletedAt) {
    return { success: false, error: "Agreement not found", code: "NOT_FOUND" };
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return { success: false, error: "Agreement has no published version", code: "NOT_FOUND" };
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
    return validationError(parsed.error);
  }

  // Check for existing signature
  const existingSignature = await prisma.signature.findUnique({
    where: {
      userId_agreementId: { userId, agreementId: agreement.id },
    },
  });

  if (existingSignature && !existingSignature.revokedAt) {
    return { success: false, error: "You have already signed this agreement", code: "CONFLICT" };
  }

  const ipAddress = await getClientIp();

  try {
    await prisma.$transaction(async (tx) => {
      const signatureType = input.signatureType ?? "individual";
      const signature = await tx.signature.create({
        data: {
          userId,
          agreementId: agreement.id,
          versionId: latestVersion.id,
          signatureType,
          source: "online",
          ipAddress,
          companyName: signatureType === "corporate" ? (input.companyName ?? null) : null,
          companyDomain: signatureType === "corporate" ? (input.companyDomain ?? null) : null,
          companyTitle: signatureType === "corporate" ? (input.companyTitle ?? null) : null,
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

      await logAudit(tx, {
        userId,
        action: "signature.sign",
        entityType: "Signature",
        entityId: signature.id,
        after: {
          agreementId: agreement.id,
          versionId: latestVersion.id,
          version: latestVersion.version,
          fieldsCount: fieldEntries.length,
        },
        ipAddress,
      });
    });
  } catch (error) {
    // Handle unique constraint violation (race condition)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { success: false, error: "You have already signed this agreement", code: "CONFLICT" };
    }
    throw error;
  }

  // Trigger async re-check of open PRs (fire-and-forget)
  recheckOpenPRs(agreement.id).catch(() => {});

  // Send email notification (fire-and-forget)
  if (agreement.notifyOnSign && agreement.owner.email) {
    const agreementLabel =
      agreement.scope === "org"
        ? `${agreement.ownerName} (Org-wide)`
        : `${agreement.ownerName}/${agreement.repoName}`;
    notifyNewSignature({
      agreementId: agreement.id,
      signerName: session.user.nickname,
      signerLogin: session.user.nickname,
      ownerEmail: agreement.owner.email,
      agreementLabel,
    }).catch(() => {});
  }

  return { success: true };
}

