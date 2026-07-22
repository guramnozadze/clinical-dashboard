// Mirrors app/schemas/participant.py on the FastAPI side.
// The const arrays exist so form selects and validators share one source of
// truth with the types.

export const STUDY_GROUPS = ["treatment", "control"] as const;
export type StudyGroup = (typeof STUDY_GROUPS)[number];

export const PARTICIPANT_STATUSES = ["active", "completed", "withdrawn"] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export const GENDERS = ["F", "M", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export interface Participant {
  participant_id: string; // UUID
  subject_id: string;
  study_group: StudyGroup;
  enrollment_date: string; // ISO date, YYYY-MM-DD
  status: ParticipantStatus;
  age: number;
  gender: Gender;
}

/** Payload for POST /participants; the server generates participant_id. */
export type ParticipantCreate = Omit<Participant, "participant_id">;

/** Payload for PUT /participants/{id}; subject_id is immutable (ADR 0011). */
export type ParticipantUpdate = Omit<ParticipantCreate, "subject_id">;
