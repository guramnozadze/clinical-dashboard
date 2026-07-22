import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

import { jsonResponse, mockFetchRoutes, TestProviders } from "./helpers";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
}));

describe("login flow", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits credentials and redirects to /dashboard on success", async () => {
    let authenticated = false;
    const fetchMock = mockFetchRoutes({
      "GET /api/auth/me": () =>
        authenticated
          ? jsonResponse({ username: "admin" })
          : jsonResponse({ detail: "Not authenticated" }, 401),
      "POST /api/auth/login": () => {
        authenticated = true;
        return new Response(null, { status: 204 });
      },
    });

    render(<LoginPage />, { wrapper: TestProviders });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "admin123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));

    const loginCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(loginCall?.[1]?.body).toBe(
      JSON.stringify({ username: "admin", password: "admin123" }),
    );
  });

  it("shows the backend error message on failed login and stays put", async () => {
    mockFetchRoutes({
      "GET /api/auth/me": () =>
        jsonResponse({ detail: "Not authenticated" }, 401),
      "POST /api/auth/login": () =>
        jsonResponse({ detail: "Incorrect username or password" }, 401),
    });

    render(<LoginPage />, { wrapper: TestProviders });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect username or password",
    );
    expect(replace).not.toHaveBeenCalled();
    // Form is usable again for another attempt.
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });
});
