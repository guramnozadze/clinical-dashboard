import { apiErrorMessage, type ApiErrorBody } from "@/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE = "/api/backend";

/**
 * Fetch wrapper for all FastAPI calls (via the ADR 0008 proxy). Throws
 * ApiError with a displayable message on any non-2xx response. A 401 means
 * the session cookie expired mid-use: the user is sent back through login
 * with a return-to, since no data call can succeed anymore.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 401) {
    const next = encodeURIComponent(window.location.pathname);
    window.location.assign(`/login?next=${next}`);
    throw new ApiError(401, "Session expired");
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({ detail: response.statusText }))) as ApiErrorBody;
    throw new ApiError(response.status, apiErrorMessage(body));
  }

  return response.json() as Promise<T>;
}
