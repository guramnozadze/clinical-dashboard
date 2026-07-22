import { describe, expect, it } from "vitest";

import { computeMetrics } from "@/lib/metrics";
import {
  validateParticipantForm,
  type ParticipantFormValues,
} from "@/lib/participant-form";
import type { Participant } from "@/types";

const VALID: ParticipantFormValues = {
  subject_id: "SUBJ-010",
  study_group: "treatment",
  enrollment_date: "2026-01-15",
  status: "active",
  age: "42",
  gender: "F",
};

describe("validateParticipantForm", () => {
  it("accepts valid values and returns a typed payload", () => {
    const { errors, data } = validateParticipantForm(VALID);
    expect(errors).toEqual({});
    expect(data).toEqual({
      subject_id: "SUBJ-010",
      study_group: "treatment",
      enrollment_date: "2026-01-15",
      status: "active",
      age: 42,
      gender: "F",
    });
  });

  it("trims subject_id before validating, matching the backend", () => {
    const { data } = validateParticipantForm({
      ...VALID,
      subject_id: "  SUBJ-010  ",
    });
    expect(data?.subject_id).toBe("SUBJ-010");
  });

  it.each([
    [{ subject_id: "" }, "subject_id", "required"],
    [{ subject_id: "bad subject!" }, "subject_id", "letters and digits"],
    [{ subject_id: "x".repeat(65) }, "subject_id", "at most 64"],
    [{ study_group: "" }, "study_group", "Select"],
    [{ enrollment_date: "" }, "enrollment_date", "required"],
    [{ enrollment_date: "2999-01-01" }, "enrollment_date", "future"],
    [{ status: "" }, "status", "Select"],
    [{ age: "" }, "age", "whole number"],
    [{ age: "12.5" }, "age", "whole number"],
    [{ age: "-1" }, "age", "between 0 and 120"],
    [{ age: "121" }, "age", "between 0 and 120"],
    [{ gender: "" }, "gender", "Select"],
  ] as const)(
    "rejects %o",
    (override, field, messageFragment) => {
      const { errors, data } = validateParticipantForm({
        ...VALID,
        ...override,
      });
      expect(data).toBeNull();
      expect(errors[field]).toMatch(new RegExp(messageFragment, "i"));
    },
  );
});

describe("computeMetrics", () => {
  it("aggregates counts by status and study group", () => {
    const participants = [
      { status: "active", study_group: "treatment" },
      { status: "active", study_group: "control" },
      { status: "withdrawn", study_group: "treatment" },
    ] as Participant[];

    expect(computeMetrics(participants)).toEqual({
      total: 3,
      byStatus: { active: 2, completed: 0, withdrawn: 1 },
      byGroup: { treatment: 2, control: 1 },
    });
  });

  it("returns zeroes for an empty roster", () => {
    expect(computeMetrics([])).toEqual({
      total: 0,
      byStatus: { active: 0, completed: 0, withdrawn: 0 },
      byGroup: { treatment: 0, control: 0 },
    });
  });
});
