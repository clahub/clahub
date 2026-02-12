import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { parsePagination, paginatedResponse } from "@/lib/api-pagination";
import { apiSignAgreementSchema } from "@/lib/schemas/api";
import { buildSigningSchema, type SerializedField } from "@/lib/schemas/signing";
import { getClientIp, logAudit } from "@/lib/audit";
import { recheckOpenPRs } from "@/lib/cla-check";
import { notifyNewSignature } from "@/lib/email";

type RouteParams = { params: Promise<{ owner: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const rl = applyRateLimit(request, user);
  if (rl.response) return rl.response;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
  });

  if (!agreement) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  if (agreement.ownerId !== user.id) {
    return apiError(ErrorCode.FORBIDDEN, "Not the agreement owner", 403);
  }

  const { page, per_page } = parsePagination(request);
  const skip = (page - 1) * per_page;

  const [signatures, total] = await Promise.all([
    prisma.signature.findMany({
      where: { agreementId: agreement.id },
      include: {
        user: {
          select: { nickname: true, email: true, avatarUrl: true },
        },
        version: { select: { version: true } },
      },
      orderBy: { signedAt: "desc" },
      skip,
      take: per_page,
    }),
    prisma.signature.count({ where: { agreementId: agreement.id } }),
  ]);

  const data = signatures.map((s) => ({
    id: s.id,
    user: {
      nickname: s.user.nickname,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
    },
    version: s.version.version,
    signatureType: s.signatureType,
    signedAt: s.signedAt,
    source: s.source,
    revokedAt: s.revokedAt,
    ...(s.signatureType === "corporate" && {
      companyName: s.companyName,
      companyDomain: s.companyDomain,
      companyTitle: s.companyTitle,
    }),
  }));

  return paginatedResponse(data, total, page, per_page, request);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const rlPost = applyRateLimit(request, user);
  if (rlPost.response) return rlPost.response;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
      owner: { select: { email: true } },
    },
  });

  if (!agreement) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return apiError(
      ErrorCode.NOT_FOUND,
      "Agreement has no published version",
      404,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(ErrorCode.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const parsed = apiSignAgreementSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] = issue.message;
    }
    return apiError(
      ErrorCode.VALIDATION_ERROR,
      "Validation failed",
      422,
      fields,
    );
  }

  // Validate fields against agreement schema
  const serializedFields: SerializedField[] = agreement.fields.map((f) => ({
    id: f.id,
    label: f.label,
    dataType: f.dataType as SerializedField["dataType"],
    required: f.required,
    description: f.description,
    sortOrder: f.sortOrder,
  }));

  const fieldSchema = buildSigningSchema(serializedFields);
  const fieldResult = fieldSchema.safeParse(parsed.data.fields);
  if (!fieldResult.success) {
    const fields: Record<string, string> = {};
    for (const issue of fieldResult.error.issues) {
      fields[issue.path.join(".")] = issue.message;
    }
    return apiError(
      ErrorCode.VALIDATION_ERROR,
      "Field validation failed",
      422,
      fields,
    );
  }

  // Check for existing signature
  const existing = await prisma.signature.findUnique({
    where: {
      userId_agreementId: { userId: user.id, agreementId: agreement.id },
    },
  });

  if (existing && !existing.revokedAt) {
    return apiError(
      ErrorCode.CONFLICT,
      "You have already signed this agreement",
      409,
    );
  }

  const ipAddress = await getClientIp();

  try {
    const signature = await prisma.$transaction(async (tx) => {
      const sig = await tx.signature.create({
        data: {
          userId: user.id,
          agreementId: agreement.id,
          versionId: latestVersion.id,
          signatureType: parsed.data.signatureType ?? "individual",
          source: "api",
          ipAddress,
          companyName: parsed.data.companyName ?? null,
          companyDomain: parsed.data.companyDomain ?? null,
          companyTitle: parsed.data.companyTitle ?? null,
        },
      });

      const fieldEntries = agreement.fields.map((f) => ({
        signatureId: sig.id,
        fieldId: f.id,
        value:
          f.dataType === "checkbox"
            ? String(parsed.data.fields[`field_${f.id}`] ?? false)
            : String(parsed.data.fields[`field_${f.id}`] ?? ""),
      }));

      if (fieldEntries.length > 0) {
        await tx.fieldEntry.createMany({ data: fieldEntries });
      }

      await logAudit(tx, {
        userId: user.id,
        action: "signature.sign",
        entityType: "Signature",
        entityId: sig.id,
        after: {
          agreementId: agreement.id,
          versionId: latestVersion.id,
          version: latestVersion.version,
          source: "api",
        },
        ipAddress,
      });

      return sig;
    });

    // Fire-and-forget: recheck PRs and notify
    recheckOpenPRs(agreement.id).catch(() => {});

    if (agreement.notifyOnSign && agreement.owner.email) {
      const agreementLabel = `${agreement.ownerName} (Org-wide)`;
      notifyNewSignature({
        agreementId: agreement.id,
        signerName: user.nickname,
        signerLogin: user.nickname,
        ownerEmail: agreement.owner.email,
        agreementLabel,
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        data: {
          id: signature.id,
          agreementId: agreement.id,
          version: latestVersion.version,
          signedAt: signature.signedAt,
          source: signature.source,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return apiError(
        ErrorCode.CONFLICT,
        "You have already signed this agreement",
        409,
      );
    }
    throw error;
  }
}
