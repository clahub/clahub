import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // API v1 routes handle their own authentication
  if (pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // Settings routes require owner auth
  if (pathname.startsWith("/settings/")) {
    if (!req.auth) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (req.auth.user.role !== "owner") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/agreements")) {
    // Public signing routes:
    // /agreements/[owner] (org signing, 1 segment)
    // /agreements/[owner]/[repo] (repo signing, 2 segments)
    const segments = pathname
      .replace(/^\/agreements\/?/, "")
      .split("/")
      .filter(Boolean);
    if (
      (segments.length === 1 &&
        segments[0] !== "new" &&
        segments[0] !== "edit") ||
      (segments.length === 2 && segments[0] !== "edit")
    ) {
      return NextResponse.next();
    }

    // All other /agreements/* routes require owner auth
    if (!req.auth) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (req.auth.user.role !== "owner") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/agreements/:path*", "/api/v1/:path*", "/settings/:path*"],
};
