"use client";

import { AuthProvider } from "@/context/AuthContext";

// Single composition point for client-side providers; the TanStack Query
// provider joins here in step 7.
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
