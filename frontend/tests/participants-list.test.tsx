import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ParticipantsPage from "@/app/participants/page";
import type { Participant } from "@/types";

import { jsonResponse, mockFetchRoutes, TestProviders } from "./helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/participants",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const PARTICIPANTS: Participant[] = [
  {
    participant_id: "0b1f6f5e-9d0a-4a0f-8b39-27f5f1a2c111",
    subject_id: "SUBJ-001",
    study_group: "treatment",
    enrollment_date: "2026-01-15",
    status: "active",
    age: 42,
    gender: "F",
  },
  {
    participant_id: "1c2e7a6f-0e1b-4b10-9c40-38a6a2b3d222",
    subject_id: "SUBJ-002",
    study_group: "control",
    enrollment_date: "2026-02-03",
    status: "completed",
    age: 61,
    gender: "M",
  },
];

const AUTHED_ME = {
  "GET /api/auth/me": () => jsonResponse({ username: "admin" }),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("participants list states", () => {
  it("shows the loading skeleton while the query is in flight", () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      // Never resolves: keeps the query pending for the duration of the test.
      "GET /api/backend/participants": () => new Promise<Response>(() => {}),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });

    expect(
      screen.getByRole("status", { name: "Loading participants" }),
    ).toBeInTheDocument();
  });

  it("renders a row per participant on success", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse(PARTICIPANTS),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });

    expect(await screen.findByText("SUBJ-001")).toBeInTheDocument();
    expect(screen.getByText("SUBJ-002")).toBeInTheDocument();
    expect(screen.getByText("2 enrolled participants")).toBeInTheDocument();
    // 1 header row + 2 data rows
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("shows the error state with the backend detail, and retries", async () => {
    let failures = 0;
    mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => {
        failures += 1;
        return failures === 1
          ? jsonResponse({ detail: "Internal server error" }, 500)
          : jsonResponse(PARTICIPANTS);
      },
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent("Internal server error");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("SUBJ-001")).toBeInTheDocument();
  });

  it("shows the empty state when no participants exist", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse([]),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });

    expect(await screen.findByText("No participants yet")).toBeInTheDocument();
  });
});
