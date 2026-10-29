import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subtasksApi, tagsApi, tasksApi, type ListTasksQuery } from "./tasks";

// 任务列表：查询键随筛选参数变化，自动失效重取
export function useTasks(query: ListTasksQuery = {}) {
  return useQuery({
    queryKey: ["tasks", "list", query],
    queryFn: () => tasksApi.list(query),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: () => tasksApi.detail(id),
    enabled: !!id,
  });
}

export function useTags() {
  return useQuery({ queryKey: ["tags"], queryFn: tagsApi.list });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", "list"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof tasksApi.update>[1] }) =>
      tasksApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", "list"] });
      qc.invalidateQueries({ queryKey: ["tasks", "detail", vars.id] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", "list"] }),
  });
}

export function useSetTaskTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagIds }: { id: string; tagIds: string[] }) =>
      tasksApi.setTags(id, tagIds),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["tasks", "detail", vars.id] }),
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      subtasksApi.create(taskId, title),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["tasks", "detail", vars.taskId] }),
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof subtasksApi.update>[1] }) =>
      subtasksApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", "detail"] }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subtasksApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", "detail"] }),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
