import type {
  Participant,
  ParticipantCreate,
  ParticipantUpdate,
} from "@/types";

import { apiFetch } from "./client";

// Typed client for the full FastAPI participants contract.

export function listParticipants(): Promise<Participant[]> {
  return apiFetch<Participant[]>("/participants");
}

export function getParticipant(participantId: string): Promise<Participant> {
  return apiFetch<Participant>(`/participants/${participantId}`);
}

export function createParticipant(
  data: ParticipantCreate,
): Promise<Participant> {
  return apiFetch<Participant>("/participants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateParticipant(
  participantId: string,
  data: ParticipantUpdate,
): Promise<Participant> {
  return apiFetch<Participant>(`/participants/${participantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteParticipant(participantId: string): Promise<void> {
  return apiFetch<void>(`/participants/${participantId}`, {
    method: "DELETE",
  });
}
