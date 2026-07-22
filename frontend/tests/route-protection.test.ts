import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

function request(path: string, { authenticated = false } = {}): NextRequest {
  const req = new NextRequest(new URL(`http://localhost:3000${path}`));
  if (authenticated) {
    req.cookies.set("access_token", "some-jwt");
  }
  return req;
}

function redirectTarget(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname + new URL(location).search : null;
}

describe("route protection (proxy.ts)", () => {
  it("redirects unauthenticated /dashboard to login with return-to", () => {
    const response = proxy(request("/dashboard"));
    expect(redirectTarget(response)).toBe("/login?next=%2Fdashboard");
  });

  it("redirects unauthenticated /participants/new to login with return-to", () => {
    const response = proxy(request("/participants/new"));
    expect(redirectTarget(response)).toBe("/login?next=%2Fparticipants%2Fnew");
  });

  it("lets authenticated requests through to protected pages", () => {
    const response = proxy(request("/dashboard", { authenticated: true }));
    expect(redirectTarget(response)).toBeNull();
  });

  it("sends authenticated visitors away from /login", () => {
    const response = proxy(request("/login", { authenticated: true }));
    expect(redirectTarget(response)).toBe("/dashboard");
  });

  it("routes / by auth status", () => {
    expect(redirectTarget(proxy(request("/")))).toBe("/login");
    expect(redirectTarget(proxy(request("/", { authenticated: true })))).toBe(
      "/dashboard",
    );
  });

  it("leaves the anonymous login page alone", () => {
    const response = proxy(request("/login"));
    expect(redirectTarget(response)).toBeNull();
  });
});
