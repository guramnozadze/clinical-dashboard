"use client";

import { AppHeader } from "@/components/AppHeader";
import { BreakdownBars } from "@/components/BreakdownBars";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { StatTile } from "@/components/StatTile";
import { useParticipants } from "@/hooks/useParticipants";
import { computeMetrics } from "@/lib/metrics";
import { PARTICIPANT_STATUSES, STUDY_GROUPS } from "@/types";

function percent(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}% of total` : "";
}

export default function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useParticipants();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enrollment and status overview, derived from the participant roster.
        </p>

        {isPending ? (
          <div
            role="status"
            aria-label="Loading metrics"
            className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-28 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-6">
            <ErrorState message={error.message} onRetry={() => refetch()} />
          </div>
        ) : data.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No data to summarize"
              description="Metrics appear once participants are enrolled."
            />
          </div>
        ) : (
          (() => {
            const metrics = computeMetrics(data);
            return (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatTile label="Total participants" value={metrics.total} />
                  {PARTICIPANT_STATUSES.map((status) => (
                    <StatTile
                      key={status}
                      label={status}
                      value={metrics.byStatus[status]}
                      detail={percent(metrics.byStatus[status], metrics.total)}
                    />
                  ))}
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <BreakdownBars
                    title="By study group"
                    rows={STUDY_GROUPS.map((group) => ({
                      label: group,
                      count: metrics.byGroup[group],
                    }))}
                    total={metrics.total}
                  />
                  <BreakdownBars
                    title="By status"
                    rows={PARTICIPANT_STATUSES.map((status) => ({
                      label: status,
                      count: metrics.byStatus[status],
                    }))}
                    total={metrics.total}
                  />
                </div>
              </>
            );
          })()
        )}
      </main>
    </>
  );
}
