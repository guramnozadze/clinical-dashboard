import {
  PARTICIPANT_STATUSES,
  STUDY_GROUPS,
  type Participant,
  type ParticipantStatus,
  type StudyGroup,
} from "@/types";

export interface TrialMetrics {
  total: number;
  byStatus: Record<ParticipantStatus, number>;
  byGroup: Record<StudyGroup, number>;
}

/** Pure aggregation over the participants list; derived client-side from the
 * same TanStack Query cache the list page uses (no metrics endpoint). */
export function computeMetrics(participants: Participant[]): TrialMetrics {
  const byStatus = Object.fromEntries(
    PARTICIPANT_STATUSES.map((status) => [status, 0]),
  ) as Record<ParticipantStatus, number>;
  const byGroup = Object.fromEntries(
    STUDY_GROUPS.map((group) => [group, 0]),
  ) as Record<StudyGroup, number>;

  for (const participant of participants) {
    byStatus[participant.status] += 1;
    byGroup[participant.study_group] += 1;
  }

  return { total: participants.length, byStatus, byGroup };
}
