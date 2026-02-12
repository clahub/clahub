import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { generateAgreementPdf, type PdfSignatory } from "@/lib/export-pdf";

type RouteParams = { params: Promise<{ owner: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await authenticateRequest(request);
  if (!user) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const rl = applyRateLimit(request, user);
  if (rl.response) return rl.response;

  const { owner } = await params;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  if (!agreement || agreement.ownerId !== user.id) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  const latestVersion = agreement.versions[0];
  if (!latestVersion) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement has no published version", 404);
  }

  const includeSignatures =
    request.nextUrl.searchParams.get("signatures") === "true";

  let signatories: PdfSignatory[] | undefined;
  if (includeSignatures) {
    const signatures = await prisma.signature.findMany({
      where: { agreementId: agreement.id, revokedAt: null },
      include: {
        user: { select: { nickname: true, name: true } },
        version: { select: { version: true } },
      },
      orderBy: { signedAt: "desc" },
    });
    signatories = signatures.map((s) => ({
      username: s.user.nickname,
      name: s.user.name,
      signedAt: s.signedAt,
      version: s.version.version,
    }));
  }

  const pdf = await generateAgreementPdf(
    {
      ownerName: agreement.ownerName,
      repoName: agreement.repoName,
      scope: agreement.scope,
      version: latestVersion.version,
      text: latestVersion.text,
      generatedAt: new Date(),
    },
    signatories,
  );

  const filename = `${owner}-org-cla-v${latestVersion.version}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
