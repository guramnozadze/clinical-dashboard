"use client";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ParticipantsTable } from "@/components/ParticipantsTable";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useParticipants } from "@/hooks/useParticipants";

export default function ParticipantsPage() {
  const { data, isPending, isError, error, refetch } = useParticipants();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Participants
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data
                ? `${data.length} enrolled participant${data.length === 1 ? "" : "s"}`
                : "Trial participant roster"}
            </p>
          </div>
        </div>

        {isPending ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            title="No participants yet"
            description="Enrolled participants will appear here."
          />
        ) : (
          <ParticipantsTable participants={data} />
        )}
      </main>
    </>
  );
}
