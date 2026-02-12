import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { generateSignaturesCsv, type SignatureRow } from "@/lib/export-csv";

type RouteParams = { params: Promise<{ owner: string; repo: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const rl = applyRateLimit(request, user);
  if (rl.response) return rl.response;

  const { owner, repo } = await params;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, repoName: repo, deletedAt: null },
    include: {
      fields: { where: { enabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!agreement || agreement.ownerId !== user.id) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  const signatures = await prisma.signature.findMany({
    where: { agreementId: agreement.id },
    include: {
      user: { select: { nickname: true, name: true, email: true } },
      version: { select: { version: true } },
      entries: { include: { field: { select: { label: true } } } },
    },
    orderBy: { signedAt: "desc" },
  });

  const fieldLabels = agreement.fields.map((f) => f.label);

  const rows: SignatureRow[] = signatures.map((s) => ({
    name: s.user.name,
    username: s.user.nickname,
    email: s.user.email,
    signedAt: s.signedAt,
    version: s.version.version,
    ipAddress: s.ipAddress,
    source: s.source,
    revokedAt: s.revokedAt,
    fields: Object.fromEntries(
      s.entries.map((e) => [e.field.label, e.value]),
    ),
  }));

  const includeRevoked = request.nextUrl.searchParams.get("revoked") === "true";
  const csv = generateSignaturesCsv(rows, { includeRevoked, fieldLabels });
  const filename = `${owner}-${repo}-signatures.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
