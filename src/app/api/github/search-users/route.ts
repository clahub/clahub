import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, ErrorCode } from "@/lib/api-error";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.accessToken) {
    return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const res = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=8`,
    {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    return NextResponse.json({ items: [] });
  }

  const data = await res.json();
  const items = (data.items ?? []).map((u: { login: string; avatar_url: string }) => ({
    login: u.login,
    avatarUrl: u.avatar_url,
  }));

  return NextResponse.json({ items });
}
