import type { Participant, ParticipantStatus, StudyGroup } from "@/types";

const STATUS_STYLES: Record<ParticipantStatus, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  completed: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  withdrawn: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const GROUP_STYLES: Record<StudyGroup, string> = {
  treatment:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  control: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function ParticipantsTable({
  participants,
}: {
  participants: Participant[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            <th scope="col" className="px-4 py-3">Subject ID</th>
            <th scope="col" className="px-4 py-3">Study group</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Enrolled</th>
            <th scope="col" className="px-4 py-3">Age</th>
            <th scope="col" className="px-4 py-3">Gender</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {participants.map((participant) => (
            <tr key={participant.participant_id}>
              <td className="px-4 py-3 font-medium">{participant.subject_id}</td>
              <td className="px-4 py-3">
                <Badge
                  label={participant.study_group}
                  className={GROUP_STYLES[participant.study_group]}
                />
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={participant.status}
                  className={STATUS_STYLES[participant.status]}
                />
              </td>
              <td className="px-4 py-3 tabular-nums">
                {participant.enrollment_date}
              </td>
              <td className="px-4 py-3 tabular-nums">{participant.age}</td>
              <td className="px-4 py-3">{participant.gender}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
