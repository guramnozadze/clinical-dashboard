export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}
