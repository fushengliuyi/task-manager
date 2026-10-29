import { useUpdateTask } from "../api/hooks";
import type { Task } from "../types";
import { CATEGORY_LABELS, STATUS_LABELS } from "../types";
import { PriorityBadge } from "./PriorityBadge";

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  return due < t;
}

function isToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dueDate === t;
}

export function TaskRow({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (id: string) => void;
}) {
  const update = useUpdateTask();
  const overdue = isOverdue(task.dueDate);
  const today = isToday(task.dueDate);
  const done = task.status === "done";

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition hover:border-slate-700">
      <button
        onClick={() =>
          update.mutate({
            id: task.id,
            input: { status: done ? "todo" : "done" },
          })
        }
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          done
            ? "border-indigo-500 bg-indigo-500 text-white"
            : "border-slate-600 hover:border-slate-400"
        }`}
        aria-label={done ? "标记为未完成" : "标记为完成"}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-2">
            <path d="M2 6l3 3 5-6" />
          </svg>
        )}
      </button>

      <button onClick={() => onEdit(task.id)} className="flex-1 text-left">
        <p
          className={`text-sm ${
            done ? "text-slate-500 line-through" : "text-slate-100"
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded bg-slate-800 px-1.5 py-0.5">
            {CATEGORY_LABELS[task.category]}
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5">
            {STATUS_LABELS[task.status]}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span
              className={
                overdue && !done
                  ? "text-rose-400"
                  : today && !done
                    ? "text-amber-300"
                    : ""
              }
            >
              {overdue && !done ? "已逾期 " : today && !done ? "今天到期 " : ""}
              {task.dueDate}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
