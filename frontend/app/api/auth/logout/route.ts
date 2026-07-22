import { NextResponse } from "next/server";

import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions, maxAge: 0 });
  return response;
}
