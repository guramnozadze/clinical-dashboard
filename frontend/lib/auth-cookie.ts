// Server-side only: imported by route handlers (and later proxy.ts), never
// by client components. See docs/adr/0007-jwt-in-httponly-cookie.md.

export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

export const AUTH_COOKIE = "access_token";

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  // Matches the backend's ACCESS_TOKEN_EXPIRE_MINUTES so cookie and JWT
  // expire together.
  maxAge: 60 * 30,
} as const;
