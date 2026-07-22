"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteParticipant } from "@/lib/api/participants";

import { participantsQueryKey } from "./useParticipants";

export function useDeleteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteParticipant,
    // Invalidate rather than optimistically remove; see docs/adr/0010.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: participantsQueryKey }),
  });
}
