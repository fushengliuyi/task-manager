import { TaskRow } from "../components/TaskRow";
import type { Task } from "../types";

export function ListView({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="py-16 text-center text-slate-500">
        暂无任务，点击右上角「新建」添加
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  );
}
