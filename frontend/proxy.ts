import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/auth-cookie";

// Route protection at the edge (Next 16 renamed `middleware` to `proxy`).
// This checks cookie PRESENCE only: the edge cannot verify the JWT signature
// without sharing the backend secret, and does not need to - a forged cookie
// gets past this redirect but every data request still dies with a 401 from
// FastAPI. This exists for UX (no flash of protected UI, no wasted render),
// not as the security boundary.

const PROTECTED_PREFIXES = ["/dashboard", "/participants"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/login", request.url),
    );
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/participants/:path*"],
};
