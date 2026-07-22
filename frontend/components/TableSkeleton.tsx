export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading participants"
      className="animate-pulse overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
    >
      <div className="h-10 bg-zinc-100 dark:bg-zinc-900" />
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex gap-4 px-4 py-3.5">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
