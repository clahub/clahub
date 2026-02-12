import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, ErrorCode } from "@/lib/api-error";
import { applyRateLimit } from "@/lib/api-rate-limit";

type RouteParams = {
  params: Promise<{ owner: string; repo: string; username: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rl = applyRateLimit(request, null);
  if (rl.response) return rl.response;

  const { owner, repo, username } = await params;

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, repoName: repo, deletedAt: null },
  });

  if (!agreement) {
    return apiError(ErrorCode.NOT_FOUND, "Agreement not found", 404);
  }

  const user = await prisma.user.findFirst({
    where: { nickname: username },
  });

  if (!user) {
    return NextResponse.json({
      data: { signed: false, username },
    });
  }

  const signature = await prisma.signature.findUnique({
    where: {
      userId_agreementId: { userId: user.id, agreementId: agreement.id },
    },
    include: { version: { select: { version: true } } },
  });

  if (signature && !signature.revokedAt) {
    return NextResponse.json({
      data: {
        signed: true,
        username,
        signedAt: signature.signedAt,
        version: signature.version.version,
        signatureType: signature.signatureType,
      },
    });
  }

  // Check corporate domain coverage
  if (user.email) {
    const atIdx = user.email.lastIndexOf("@");
    if (atIdx > 0) {
      const domain = user.email.slice(atIdx + 1).toLowerCase();
      const corpSig = await prisma.signature.findFirst({
        where: {
          agreementId: agreement.id,
          signatureType: "corporate",
          companyDomain: domain,
          revokedAt: null,
        },
        include: { version: { select: { version: true } } },
      });
      if (corpSig) {
        return NextResponse.json({
          data: {
            signed: true,
            username,
            corporateCovered: true,
            companyName: corpSig.companyName,
            version: corpSig.version.version,
          },
        });
      }
    }
  }

  return NextResponse.json({
    data: { signed: false, username },
  });
}
