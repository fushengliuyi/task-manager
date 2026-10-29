import { TaskCard } from "../components/TaskCard";
import type { Status, Task } from "../types";
import { STATUS_LABELS } from "../types";

const COLUMNS: Status[] = ["todo", "in_progress", "done"];

export function BoardView({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
          >
            <h2 className="mb-3 px-1 text-sm font-medium text-slate-300">
              {STATUS_LABELS[status]}
              <span className="ml-2 text-slate-500">{items.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEdit} />
              ))}
              {items.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-600">空</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
