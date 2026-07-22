import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { AuthProvider } from "@/context/AuthContext";

/** JSON Response shorthand for fetch mocks. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Installs a fetch mock that dispatches on "METHOD pathname". Unmatched
 * requests fail the test loudly instead of hanging silently.
 */
export function mockFetchRoutes(
  routes: Record<string, () => Response | Promise<Response>>,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const pathname = new URL(url, "http://localhost").pathname;
    const key = `${init?.method ?? "GET"} ${pathname}`;
    const handler = routes[key];
    if (!handler) {
      throw new Error(`Unmocked fetch: ${key}`);
    }
    return handler();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Providers for component tests: fresh QueryClient, retries off. */
export function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
