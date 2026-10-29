import { api } from "./client";
import type {
  CreateTaskInput,
  Subtask,
  Tag,
  Task,
  TaskDetail,
  UpdateTaskInput,
} from "../types";

export interface ListTasksQuery {
  category?: string;
  status?: string;
  priority?: string;
  due?: string;
  tag?: string;
  q?: string;
  sort?: string;
}

function toQueryString(q: ListTasksQuery): string {
  const params = new URLSearchParams();
  (Object.keys(q) as (keyof ListTasksQuery)[]).forEach((k) => {
    const v = q[k];
    if (v !== undefined && v !== "") params.set(k, v);
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const tasksApi = {
  list: (q: ListTasksQuery = {}) =>
    api.get<Task[]>(`/tasks${toQueryString(q)}`),
  detail: (id: string) => api.get<TaskDetail>(`/tasks/${id}`),
  create: (input: CreateTaskInput) => api.post<Task>("/tasks", input),
  update: (id: string, input: UpdateTaskInput) =>
    api.patch<Task>(`/tasks/${id}`, input),
  remove: (id: string) => api.delete<void>(`/tasks/${id}`),
  setTags: (id: string, tagIds: string[]) =>
    api.put<void>(`/tasks/${id}/tags`, { tagIds }),
};

export const subtasksApi = {
  create: (taskId: string, title: string) =>
    api.post<Subtask>(`/tasks/${taskId}/subtasks`, { title }),
  update: (id: string, patch: { title?: string; done?: boolean; sortOrder?: number }) =>
    api.patch<Subtask>(`/subtasks/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/subtasks/${id}`),
};

export const tagsApi = {
  list: () => api.get<Tag[]>("/tags"),
  create: (name: string) => api.post<Tag>("/tags", { name }),
  remove: (id: string) => api.delete<void>(`/tags/${id}`),
};
