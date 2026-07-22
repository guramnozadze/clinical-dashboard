interface BreakdownRow {
  label: string;
  count: number;
}

// Horizontal bar rows in a single hue (#2a78d6 / #3987e5, validated against
// both surfaces): identity is carried by the row label, magnitude by length.
// Bars are rounded at the value end only, anchored flat to the baseline.
export function BreakdownBars({
  title,
  rows,
  total,
}: {
  title: string;
  rows: BreakdownRow[];
  total: number;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-medium">{title}</h2>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => {
          const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
          return (
            <div
              key={row.label}
              className="group grid grid-cols-[6.5rem_1fr_auto] items-center gap-3"
              title={`${row.label}: ${row.count} of ${total} (${share}%)`}
            >
              <dt className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
                {row.label}
              </dt>
              <dd className="relative h-5">
                <div className="absolute inset-y-1 left-0 w-full rounded-r bg-zinc-100 dark:bg-zinc-800" />
                <div
                  className="absolute inset-y-1 left-0 rounded-r bg-[#2a78d6] transition-opacity group-hover:opacity-80 dark:bg-[#3987e5]"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </dd>
              <dd className="text-right text-sm tabular-nums">
                <span className="font-medium">{row.count}</span>
                <span className="ml-1 text-zinc-500">({share}%)</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
