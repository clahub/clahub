import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/agreements")) {
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
  matcher: ["/agreements/:path*"],
};
