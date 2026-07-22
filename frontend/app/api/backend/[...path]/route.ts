import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL, AUTH_COOKIE } from "@/lib/auth-cookie";

// The thin token-attaching proxy from docs/adr/0008: forwards the request
// verbatim to FastAPI with the JWT from the httpOnly cookie as a Bearer
// header, and streams the response back untouched. No business logic ever
// belongs here - FastAPI's contract is the only API contract.

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { path } = await context.params;
  const url = new URL(`${API_BASE_URL}/${path.join("/")}`);
  url.search = request.nextUrl.search;

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(request: NextRequest, context: Context) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: Context) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  return forward(request, context);
}
