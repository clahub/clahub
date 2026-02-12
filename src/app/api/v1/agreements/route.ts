import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { apiCreateAgreementSchema } from "@/lib/schemas/api";
import { getClientIp, logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const rl = applyRateLimit(request, user);
  if (rl.response) return rl.response;

  if (user.role !== "owner") {
    return apiError(ErrorCode.FORBIDDEN, "Owner role required", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(ErrorCode.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const parsed = apiCreateAgreementSchema.safeParse(body);
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

  const data = parsed.data;

  // Uniqueness check
  if (data.scope === "org") {
    const existing = await prisma.agreement.findFirst({
      where: { githubOrgId: data.githubOrgId, scope: "org", deletedAt: null },
    });
    if (existing) {
      return apiError(
        ErrorCode.CONFLICT,
        "An org-wide agreement already exists for this organization",
        409,
      );
    }
  } else {
    const existing = await prisma.agreement.findUnique({
      where: { githubRepoId: data.githubRepoId },
    });
    if (existing && !existing.deletedAt) {
      return apiError(
        ErrorCode.CONFLICT,
        "An agreement already exists for this repository",
        409,
      );
    }
  }

  const ipAddress = await getClientIp();

  const agreement = await prisma.$transaction(async (tx) => {
    const agreementData =
      data.scope === "org"
        ? {
            scope: "org" as const,
            githubOrgId: data.githubOrgId,
            githubRepoId: null,
            ownerName: data.ownerName,
            repoName: null,
            ownerId: user.id,
          }
        : {
            scope: "repo" as const,
            githubRepoId: data.githubRepoId,
            ownerName: data.ownerName,
            repoName: data.repoName,
            ownerId: user.id,
          };

    const created = await tx.agreement.create({ data: agreementData });

    await tx.agreementVersion.create({
      data: {
        agreementId: created.id,
        version: 1,
        text: data.text,
      },
    });

    if (data.fields.length > 0) {
      await tx.agreementField.createMany({
        data: data.fields.map((f, i) => ({
          agreementId: created.id,
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
      userId: user.id,
      action: "agreement.create",
      entityType: "Agreement",
      entityId: created.id,
      after: {
        scope: data.scope,
        ownerName: data.ownerName,
        ...(data.scope === "repo" && { repoName: data.repoName }),
        fieldsCount: data.fields.length,
        source: "api",
      },
      ipAddress,
    });

    return created;
  });

  const full = await prisma.agreement.findUnique({
    where: { id: agreement.id },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(
    {
      data: {
        id: full!.id,
        scope: full!.scope,
        ownerName: full!.ownerName,
        repoName: full!.repoName,
        version: full!.versions[0]?.version ?? 1,
        text: full!.versions[0]?.text ?? "",
        fields: full!.fields.map((f) => ({
          id: f.id,
          label: f.label,
          dataType: f.dataType,
          required: f.required,
          description: f.description,
          sortOrder: f.sortOrder,
        })),
        createdAt: full!.createdAt,
        updatedAt: full!.updatedAt,
      },
    },
    { status: 201 },
  );
}
