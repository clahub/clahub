import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { apiUpdateAgreementSchema } from "@/lib/schemas/api";
import { getClientIp, logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ owner: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!agreement) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  return NextResponse.json({
    data: {
      id: agreement.id,
      scope: agreement.scope,
      ownerName: agreement.ownerName,
      repoName: agreement.repoName,
      version: agreement.versions[0]?.version ?? 1,
      text: agreement.versions[0]?.text ?? "",
      fields: agreement.fields.map((f) => ({
        id: f.id,
        label: f.label,
        dataType: f.dataType,
        required: f.required,
        description: f.description,
        sortOrder: f.sortOrder,
      })),
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    },
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }
  if (user.role !== "owner") {
    return apiError(ErrorCode.FORBIDDEN, "Owner role required", 403);
  }

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!agreement || agreement.ownerId !== user.id) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(ErrorCode.VALIDATION_ERROR, "Invalid JSON body", 400);
  }

  const parsed = apiUpdateAgreementSchema.safeParse(body);
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
  const ipAddress = await getClientIp();

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

    // Reconcile fields
    const existingFieldIds = new Set(agreement.fields.map((f) => f.id));
    const incomingFieldIds = new Set(
      data.fields.filter((f) => f.id).map((f) => f.id!),
    );

    for (const field of agreement.fields) {
      if (!incomingFieldIds.has(field.id)) {
        await tx.agreementField.update({
          where: { id: field.id },
          data: { enabled: false },
        });
      }
    }

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
      userId: user.id,
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
        source: "api",
      },
      ipAddress,
    });
  });

  const updated = await prisma.agreement.findUnique({
    where: { id: agreement.id },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({
    data: {
      id: updated!.id,
      scope: updated!.scope,
      ownerName: updated!.ownerName,
      repoName: updated!.repoName,
      version: updated!.versions[0]?.version ?? 1,
      text: updated!.versions[0]?.text ?? "",
      fields: updated!.fields.map((f) => ({
        id: f.id,
        label: f.label,
        dataType: f.dataType,
        required: f.required,
        description: f.description,
        sortOrder: f.sortOrder,
      })),
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }
  if (user.role !== "owner") {
    return apiError(ErrorCode.FORBIDDEN, "Owner role required", 403);
  }

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
  });

  if (!agreement || agreement.ownerId !== user.id) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  const ipAddress = await getClientIp();

  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({
      where: { id: agreement.id },
      data: { deletedAt: new Date() },
    });

    await logAudit(tx, {
      userId: user.id,
      action: "agreement.delete",
      entityType: "Agreement",
      entityId: agreement.id,
      before: {
        ownerName: agreement.ownerName,
        scope: agreement.scope,
      },
      ipAddress,
    });
  });

  return NextResponse.json({ data: { deleted: true } });
}
