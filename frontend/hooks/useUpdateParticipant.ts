"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateParticipant } from "@/lib/api/participants";
import type { ParticipantUpdate } from "@/types";

import { participantsQueryKey } from "./useParticipants";

export function useUpdateParticipant(participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ParticipantUpdate) =>
      updateParticipant(participantId, data),
    // Invalidate rather than optimistically patch; see docs/adr/0010.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: participantsQueryKey }),
  });
}
