import {
  GENDERS,
  PARTICIPANT_STATUSES,
  STUDY_GROUPS,
  type Gender,
  type ParticipantCreate,
  type ParticipantStatus,
  type StudyGroup,
} from "@/types";

// Client-side mirror of the constraints in app/schemas/participant.py
// (backend). The server remains the authority; this exists for immediate
// feedback. See docs/adr/0009-hand-rolled-form-validation.md.

export const SUBJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
export const SUBJECT_ID_MAX_LENGTH = 64;
export const AGE_MIN = 0;
export const AGE_MAX = 120;

export interface ParticipantFormValues {
  subject_id: string;
  study_group: string;
  enrollment_date: string;
  status: string;
  age: string; // raw input value; validated into a number
  gender: string;
}

export type ParticipantFormErrors = Partial<
  Record<keyof ParticipantFormValues, string>
>;

export const EMPTY_FORM: ParticipantFormValues = {
  subject_id: "",
  study_group: "",
  enrollment_date: "",
  status: "",
  age: "",
  gender: "",
};

/** Today in the browser's timezone, as YYYY-MM-DD (for the date input max). */
export function todayIsoDate(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function validateParticipantForm(values: ParticipantFormValues): {
  errors: ParticipantFormErrors;
  data: ParticipantCreate | null;
} {
  const errors: ParticipantFormErrors = {};

  const subjectId = values.subject_id.trim();
  if (!subjectId) {
    errors.subject_id = "Subject ID is required";
  } else if (subjectId.length > SUBJECT_ID_MAX_LENGTH) {
    errors.subject_id = `Subject ID must be at most ${SUBJECT_ID_MAX_LENGTH} characters`;
  } else if (!SUBJECT_ID_PATTERN.test(subjectId)) {
    errors.subject_id =
      "Use letters and digits, optionally with dashes or underscores (e.g. SUBJ-001)";
  }

  if (!(STUDY_GROUPS as readonly string[]).includes(values.study_group)) {
    errors.study_group = "Select a study group";
  }

  if (!values.enrollment_date) {
    errors.enrollment_date = "Enrollment date is required";
  } else if (Number.isNaN(Date.parse(values.enrollment_date))) {
    errors.enrollment_date = "Enter a valid date";
  } else if (values.enrollment_date > todayIsoDate()) {
    errors.enrollment_date = "Enrollment date cannot be in the future";
  }

  if (!(PARTICIPANT_STATUSES as readonly string[]).includes(values.status)) {
    errors.status = "Select a status";
  }

  const age = Number(values.age);
  if (values.age.trim() === "" || !Number.isInteger(age)) {
    errors.age = "Age must be a whole number";
  } else if (age < AGE_MIN || age > AGE_MAX) {
    errors.age = `Age must be between ${AGE_MIN} and ${AGE_MAX}`;
  }

  if (!(GENDERS as readonly string[]).includes(values.gender)) {
    errors.gender = "Select a gender";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, data: null };
  }

  return {
    errors,
    data: {
      subject_id: subjectId,
      study_group: values.study_group as StudyGroup,
      enrollment_date: values.enrollment_date,
      status: values.status as ParticipantStatus,
      age,
      gender: values.gender as Gender,
    },
  };
}
