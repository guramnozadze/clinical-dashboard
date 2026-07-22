import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/auth-cookie";

interface JwtPayload {
  sub?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Reports auth status for the UI by decoding (NOT verifying) the JWT in the
// cookie. Deliberate: verification would require sharing the backend's
// SECRET_KEY with this process, and a forged cookie can only mislead the
// forger's own UI - every real data request is verified by FastAPI, and a
// 401 there bounces the user to login. This endpoint is advisory, never an
// authorization boundary.
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || !payload.exp || payload.exp * 1000 <= Date.now()) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ username: payload.sub });
}
