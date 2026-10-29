import { useUpdateTask } from "../api/hooks";
import type { Status, Task } from "../types";
import { STATUS_LABELS } from "../types";
import { PriorityBadge } from "./PriorityBadge";

const NEXT_STATUS: Record<Status, Status> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export function TaskCard({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (id: string) => void;
}) {
  const update = useUpdateTask();

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 transition hover:border-slate-700">
      <button onClick={() => onEdit(task.id)} className="w-full text-left">
        <p className="text-sm text-slate-100">{task.title}</p>
        {task.dueDate && (
          <p className="mt-1 text-xs text-slate-400">截止 {task.dueDate}</p>
        )}
        <div className="mt-2">
          <PriorityBadge priority={task.priority} />
        </div>
      </button>

      <button
        onClick={() =>
          update.mutate({ id: task.id, input: { status: NEXT_STATUS[task.status] } })
        }
        className="mt-2 w-full rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
      >
        移到 {STATUS_LABELS[NEXT_STATUS[task.status]]}
      </button>
    </div>
  );
}
