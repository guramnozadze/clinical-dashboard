"use client";

import { useParams, useRouter } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { ErrorState } from "@/components/ErrorState";
import { ParticipantForm } from "@/components/ParticipantForm";
import { useParticipant } from "@/hooks/useParticipant";
import { useUpdateParticipant } from "@/hooks/useUpdateParticipant";
import { participantToFormValues } from "@/lib/participant-form";
import type { ParticipantCreate, ParticipantUpdate } from "@/types";

export default function EditParticipantPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useParticipant(id);
  const mutation = useUpdateParticipant(id);

  async function handleSubmit(data: ParticipantCreate) {
    // subject_id is immutable (ADR 0011): the form locks it and the update
    // payload omits it.
    const update: ParticipantUpdate = {
      study_group: data.study_group,
      enrollment_date: data.enrollment_date,
      status: data.status,
      age: data.age,
      gender: data.gender,
    };
    try {
      await mutation.mutateAsync(update);
      router.push("/participants");
    } catch {
      // Error state is rendered from mutation.error below.
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit participant
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          {query.data
            ? `Update the record for ${query.data.subject_id}.`
            : "Update a participant record."}
        </p>
        {query.isPending ? (
          <p role="status" className="text-sm text-zinc-500">
            Loading participant…
          </p>
        ) : query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : (
          <ParticipantForm
            mode="edit"
            initialValues={participantToFormValues(query.data)}
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
            serverError={mutation.error?.message}
            onCancel={() => router.push("/participants")}
          />
        )}
      </main>
    </>
  );
}
