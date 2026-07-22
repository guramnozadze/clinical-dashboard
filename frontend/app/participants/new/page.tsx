"use client";

import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { ParticipantForm } from "@/components/ParticipantForm";
import { useCreateParticipant } from "@/hooks/useCreateParticipant";
import type { ParticipantCreate } from "@/types";

export default function NewParticipantPage() {
  const router = useRouter();
  const mutation = useCreateParticipant();

  async function handleSubmit(data: ParticipantCreate) {
    try {
      await mutation.mutateAsync(data);
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
          Add participant
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          Enroll a new participant in the trial.
        </p>
        <ParticipantForm
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          serverError={mutation.error?.message}
          onCancel={() => router.push("/participants")}
        />
      </main>
    </>
  );
}
