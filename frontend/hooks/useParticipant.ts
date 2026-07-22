"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { getParticipant } from "@/lib/api/participants";
import type { Participant } from "@/types";

import { participantsQueryKey } from "./useParticipants";

export function useParticipant(participantId: string) {
  return useQuery<Participant, ApiError>({
    // Prefixed by the list key so one invalidation covers both.
    queryKey: [...participantsQueryKey, participantId],
    queryFn: () => getParticipant(participantId),
  });
}
