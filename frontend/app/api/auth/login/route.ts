import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL, AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";
import type { Token } from "@/types";

export async function POST(request: NextRequest) {
  let username: unknown;
  let password: unknown;
  try {
    ({ username, password } = await request.json());
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { detail: "username and password are required" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Authentication service is unreachable" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const body = await upstream
      .json()
      .catch(() => ({ detail: "Login failed" }));
    return NextResponse.json(body, { status: upstream.status });
  }

  const { access_token } = (await upstream.json()) as Token;
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(AUTH_COOKIE, access_token, authCookieOptions);
  return response;
}
