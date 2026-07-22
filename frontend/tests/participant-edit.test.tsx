import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import EditParticipantPage from "@/app/participants/[id]/edit/page";
import type { Participant } from "@/types";

import { jsonResponse, mockFetchRoutes, TestProviders } from "./helpers";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push, prefetch: vi.fn() }),
  usePathname: () => "/participants/0b1f6f5e-9d0a-4a0f-8b39-27f5f1a2c111/edit",
  useParams: () => ({ id: PARTICIPANT.participant_id }),
}));

const PARTICIPANT: Participant = {
  participant_id: "0b1f6f5e-9d0a-4a0f-8b39-27f5f1a2c111",
  subject_id: "SUBJ-001",
  study_group: "treatment",
  enrollment_date: "2026-01-15",
  status: "active",
  age: 42,
  gender: "F",
};

const AUTHED_ME = {
  "GET /api/auth/me": () => jsonResponse({ username: "admin" }),
};

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockClear();
});

describe("edit participant page", () => {
  it("pre-fills the form and locks subject_id", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      [`GET /api/backend/participants/${PARTICIPANT.participant_id}`]: () =>
        jsonResponse(PARTICIPANT),
    });

    render(<EditParticipantPage />, { wrapper: TestProviders });

    const subjectIdInput = await screen.findByLabelText("Subject ID");
    expect(subjectIdInput).toHaveValue("SUBJ-001");
    expect(subjectIdInput).toBeDisabled();
    expect(screen.getByLabelText("Age")).toHaveValue(42);
  });

  it("submits the update without subject_id and redirects on success", async () => {
    const fetchMock = mockFetchRoutes({
      ...AUTHED_ME,
      [`GET /api/backend/participants/${PARTICIPANT.participant_id}`]: () =>
        jsonResponse(PARTICIPANT),
      [`PUT /api/backend/participants/${PARTICIPANT.participant_id}`]: () =>
        jsonResponse({ ...PARTICIPANT, status: "withdrawn" }),
    });

    render(<EditParticipantPage />, { wrapper: TestProviders });
    const user = userEvent.setup();

    await screen.findByLabelText("Subject ID");
    await user.selectOptions(screen.getByLabelText("Status"), "withdrawn");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/participants"));

    const putCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "PUT",
    );
    const body = JSON.parse(putCall?.[1]?.body as string);
    expect(body).not.toHaveProperty("subject_id");
    expect(body.status).toBe("withdrawn");
  });

  it("shows the backend error and stays on the page when the update fails", async () => {
    mockFetchRoutes({
      ...AUTHED_ME,
      [`GET /api/backend/participants/${PARTICIPANT.participant_id}`]: () =>
        jsonResponse(PARTICIPANT),
      [`PUT /api/backend/participants/${PARTICIPANT.participant_id}`]: () =>
        jsonResponse({ detail: "Internal server error" }, 500),
    });

    render(<EditParticipantPage />, { wrapper: TestProviders });
    const user = userEvent.setup();

    await screen.findByLabelText("Subject ID");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Internal server error",
    );
    expect(push).not.toHaveBeenCalled();
  });
});
