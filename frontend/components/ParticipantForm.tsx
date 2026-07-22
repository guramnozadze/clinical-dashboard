"use client";

import { FormEvent, useState } from "react";

import {
  EMPTY_FORM,
  todayIsoDate,
  validateParticipantForm,
  type ParticipantFormErrors,
  type ParticipantFormValues,
} from "@/lib/participant-form";
import {
  GENDERS,
  PARTICIPANT_STATUSES,
  STUDY_GROUPS,
  type ParticipantCreate,
} from "@/types";

const INPUT_CLASSES =
  "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 aria-[invalid]:border-red-400 dark:border-zinc-700 dark:bg-zinc-900";

interface FieldProps {
  label: string;
  name: keyof ParticipantFormValues;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, name, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface ParticipantFormProps {
  /** "edit" locks subject_id (immutable per ADR 0011) and relabels submit. */
  mode?: "create" | "edit";
  initialValues?: ParticipantFormValues;
  onSubmit: (data: ParticipantCreate) => void;
  isSubmitting: boolean;
  /** Error returned by the backend (e.g. duplicate subject_id), if any. */
  serverError?: string;
  onCancel: () => void;
}

export function ParticipantForm({
  mode = "create",
  initialValues,
  onSubmit,
  isSubmitting,
  serverError,
  onCancel,
}: ParticipantFormProps) {
  const [values, setValues] = useState<ParticipantFormValues>(
    initialValues ?? EMPTY_FORM,
  );
  const [errors, setErrors] = useState<ParticipantFormErrors>({});

  function setField(name: keyof ParticipantFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    // Stale error for a field the user is fixing is just noise.
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { errors: validationErrors, data } = validateParticipantForm(values);
    setErrors(validationErrors);
    if (data) {
      onSubmit(data);
    }
  }

  const fieldProps = (name: keyof ParticipantFormValues) => ({
    id: name,
    name,
    value: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => setField(name, event.target.value),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Subject ID" name="subject_id" error={errors.subject_id}>
        <input
          type="text"
          placeholder="SUBJ-004"
          disabled={mode === "edit"}
          className={`${INPUT_CLASSES} disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:disabled:bg-zinc-800`}
          {...fieldProps("subject_id")}
          aria-describedby={
            errors.subject_id
              ? "subject_id-error"
              : mode === "edit"
                ? "subject_id-hint"
                : undefined
          }
        />
        {mode === "edit" && (
          <p id="subject_id-hint" className="mt-1 text-xs text-zinc-500">
            Subject IDs cannot be changed after enrollment.
          </p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Study group" name="study_group" error={errors.study_group}>
          <select className={INPUT_CLASSES} {...fieldProps("study_group")}>
            <option value="">Select…</option>
            {STUDY_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" name="status" error={errors.status}>
          <select className={INPUT_CLASSES} {...fieldProps("status")}>
            <option value="">Select…</option>
            {PARTICIPANT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Enrollment date"
        name="enrollment_date"
        error={errors.enrollment_date}
      >
        <input
          type="date"
          max={todayIsoDate()}
          className={INPUT_CLASSES}
          {...fieldProps("enrollment_date")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Age" name="age" error={errors.age}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            className={INPUT_CLASSES}
            {...fieldProps("age")}
          />
        </Field>

        <Field label="Gender" name="gender" error={errors.gender}>
          <select className={INPUT_CLASSES} {...fieldProps("gender")}>
            <option value="">Select…</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Add participant"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
