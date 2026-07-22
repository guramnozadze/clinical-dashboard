"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { listParticipants } from "@/lib/api/participants";
import type { Participant } from "@/types";

export const participantsQueryKey = ["participants"] as const;

export function useParticipants() {
  return useQuery<Participant[], ApiError>({
    queryKey: participantsQueryKey,
    queryFn: listParticipants,
  });
}
