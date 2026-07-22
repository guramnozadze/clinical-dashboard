"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createParticipant } from "@/lib/api/participants";

import { participantsQueryKey } from "./useParticipants";

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createParticipant,
    // Invalidate rather than optimistically insert; see docs/adr/0010.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: participantsQueryKey }),
  });
}
