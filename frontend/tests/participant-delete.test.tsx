import { render, screen, waitFor } from "@testing-library/react";
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

describe("participant deletion", () => {
  it("deletes after confirmation and removes the row on refetch", async () => {
    let roster = PARTICIPANTS;
    const fetchMock = mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse(roster),
      [`DELETE /api/backend/participants/${PARTICIPANTS[0].participant_id}`]:
        () => {
          roster = roster.slice(1);
          return new Response(null, { status: 204 });
        },
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Delete SUBJ-001" }),
    );
    // Nothing is deleted until the inline confirmation is accepted.
    expect(screen.getByText("Delete SUBJ-001?")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE"),
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(screen.queryByText("SUBJ-001")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("SUBJ-002")).toBeInTheDocument();
    expect(screen.getByText("1 enrolled participant")).toBeInTheDocument();
  });

  it("cancelling the confirmation leaves the participant alone", async () => {
    const fetchMock = mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse(PARTICIPANTS),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Delete SUBJ-001" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("SUBJ-001")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete SUBJ-001" }),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE"),
    ).toBe(false);
  });

  it("shows the backend error inline when deletion fails", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse(PARTICIPANTS),
      [`DELETE /api/backend/participants/${PARTICIPANTS[0].participant_id}`]:
        () => jsonResponse({ detail: "Internal server error" }, 500),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Delete SUBJ-001" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Internal server error",
    );
    // The row is still there; the user can retry or cancel.
    expect(screen.getByText("SUBJ-001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("links each row to its edit page", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      "GET /api/backend/participants": () => jsonResponse(PARTICIPANTS),
    });

    render(<ParticipantsPage />, { wrapper: TestProviders });

    const editLink = await screen.findByRole("link", {
      name: "Edit SUBJ-001",
    });
    expect(editLink).toHaveAttribute(
      "href",
      `/participants/${PARTICIPANTS[0].participant_id}/edit`,
    );
  });
});
