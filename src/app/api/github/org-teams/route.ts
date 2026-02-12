import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, ErrorCode } from "@/lib/api-error";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.accessToken) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const org = searchParams.get("org");
  if (!org) {
    return apiError(ErrorCode.VALIDATION_ERROR, "org parameter is required", 400);
  }

  try {
    const res = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(org)}/teams?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ teams: [] });
    }

    const data = await res.json();
    const teams = (data as { slug: string; name: string; description: string | null }[]).map(
      (t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
      }),
    );

    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ teams: [] });
  }
}
