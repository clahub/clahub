import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderBadge, type BadgeStyle } from "@/lib/badge";

type RouteParams = { params: Promise<{ owner: string }> };

const BADGE_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=300, s-maxage=300",
} as const;

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { owner } = await params;
  const { searchParams } = request.nextUrl;

  const label = searchParams.get("label") || "CLA";
  const style: BadgeStyle =
    searchParams.get("style") === "flat-square" ? "flat-square" : "flat";
  const colorOverride = searchParams.get("color");

  const agreement = await prisma.agreement.findFirst({
    where: { ownerName: owner, scope: "org", deletedAt: null },
  });

  if (!agreement) {
    const svg = renderBadge({
      label,
      message: "not found",
      color: "e05d44",
      style,
    });
    return new NextResponse(svg, { headers: BADGE_HEADERS });
  }

  const signatureCount = await prisma.signature.count({
    where: { agreementId: agreement.id, revokedAt: null },
  });

  const message =
    signatureCount > 0 ? `${signatureCount} signed` : "active";
  const color = colorOverride?.match(/^[0-9a-fA-F]{3,8}$/)
    ? colorOverride
    : "4c1";

  const svg = renderBadge({ label, message, color, style });

  const etag = `"${agreement.id}-${signatureCount}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return new NextResponse(svg, {
    headers: { ...BADGE_HEADERS, ETag: etag },
  });
}
