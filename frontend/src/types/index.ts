export type Category = "personal" | "work";
export type Status = "todo" | "in_progress" | "done";
export type Priority = "none" | "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TaskDetail extends Task {
  subtasks: Subtask[];
  tags: Tag[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: Category;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface ApiError {
  error: { code: string; message: string };
}

export const CATEGORY_LABELS: Record<Category, string> = {
  personal: "生成事项",
  work: "工作事项",
};

export const STATUS_LABELS: Record<Status, string> = {
  todo: "待办",
  in_progress: "进行中",
  done: "已完成",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: "无",
  low: "低",
  medium: "中",
  high: "高",
};
