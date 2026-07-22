"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiErrorMessage, type LoginCredentials } from "@/types";

/** What the UI knows about the session. Never the token (ADR 0007). */
export interface AuthUser {
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the initial /api/auth/me check is in flight. */
  isLoading: boolean;
  /** Resolves on success; throws Error with a displayable message otherwise. */
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const sessionQueryKey = ["session"] as const;

// A non-ok /api/auth/me means "not signed in", not a query error - the
// query never rejects for that case, only for genuine network failures.
async function fetchSession(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  return response.ok ? await response.json() : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // Session lives in the query cache (like every other server value here)
  // instead of an effect-driven setState, so mount/refresh is just a query.
  const session = useQuery<AuthUser | null>({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    retry: false,
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const body = await response
          .json()
          .catch(() => ({ detail: "Login failed" }));
        throw new Error(apiErrorMessage(body));
      }
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(sessionQueryKey, null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: session.data ?? null,
      isAuthenticated: session.data != null,
      isLoading: session.isLoading,
      login,
      logout,
    }),
    [session.data, session.isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
