import { useEffect, useMemo, useState } from "react";
import {
  useCreateSubtask,
  useCreateTag,
  useCreateTask,
  useDeleteSubtask,
  useDeleteTask,
  useSetTaskTags,
  useTags,
  useTask,
  useUpdateSubtask,
  useUpdateTask,
} from "../api/hooks";
import type { Category, Priority, Status } from "../types";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "../types";

export function TaskEditor({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const isEdit = taskId !== null;
  const { data: detail, isLoading } = useTask(taskId ?? "");
  const { data: allTags = [] } = useTags();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const setTags = useSetTaskTags();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createTag = useCreateTag();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("personal");
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority>("none");
  const [dueDate, setDueDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [err, setErr] = useState("");

  // 编辑时用已有数据回填
  useEffect(() => {
    if (detail) {
      setTitle(detail.title);
      setDescription(detail.description);
      setCategory(detail.category);
      setStatus(detail.status);
      setPriority(detail.priority);
      setDueDate(detail.dueDate ?? "");
      setSelectedTags(detail.tags.map((t) => t.id));
    }
  }, [detail]);

  const subtasks = useMemo(
    () => (detail ? detail.subtasks : []),
    [detail],
  );

  async function submit() {
    setErr("");
    if (!title.trim()) {
      setErr("标题不能为空");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      priority,
      dueDate: dueDate || null,
    };
    try {
      if (isEdit && taskId) {
        await updateTask.mutateAsync({ id: taskId, input: payload });
        await setTags.mutateAsync({ id: taskId, tagIds: selectedTags });
      } else {
        const created = await createTask.mutateAsync(payload);
        if (selectedTags.length) {
          await setTags.mutateAsync({ id: created.id, tagIds: selectedTags });
        }
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function addTag() {
    const name = newTagName.trim();
    if (!name) return;
    const tag = await createTag.mutateAsync(name);
    setSelectedTags((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
    setNewTagName("");
  }

  async function addSubtask() {
    const t = newSubtask.trim();
    if (!t || !taskId) return;
    await createSubtask.mutateAsync({ taskId, title: t });
    setNewSubtask("");
  }

  async function remove() {
    if (!taskId) return;
    if (!confirm("确定删除该任务及其子任务？")) return;
    await deleteTask.mutateAsync(taskId);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="mt-8 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "编辑任务" : "新建任务"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        {isLoading && isEdit ? (
          <p className="py-8 text-center text-slate-400">加载中…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任务标题"
              autoFocus
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述（可选）"
              rows={3}
              className="resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                类型
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
                >
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                状态
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
                >
                  {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                优先级
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
                >
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                截止日
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
                />
              </label>
            </div>

            {/* 标签 */}
            <div>
              <p className="mb-1 text-xs text-slate-400">标签</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((x) => x !== tag.id)
                          : [...prev, tag.id],
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs transition ${
                      selectedTags.includes(tag.id)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="新建标签…"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                />
                <button
                  onClick={addTag}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 子任务（仅编辑态） */}
            {isEdit && (
              <div>
                <p className="mb-1 text-xs text-slate-400">
                  子任务（{subtasks.length}）
                </p>
                <div className="mb-2 flex flex-col gap-1.5">
                  {subtasks.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={s.done}
                        onChange={(e) =>
                          updateSubtask.mutate({ id: s.id, patch: { done: e.target.checked } })
                        }
                        className="h-4 w-4"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          s.done ? "text-slate-500 line-through" : "text-slate-200"
                        }`}
                      >
                        {s.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask.mutate(s.id)}
                        className="text-xs text-slate-500 hover:text-rose-400"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="添加子任务…"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                  />
                  <button
                    onClick={addSubtask}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
                  >
                    添加
                  </button>
                </div>
              </div>
            )}

            {err && <p className="text-sm text-rose-400">{err}</p>}

            <div className="mt-2 flex items-center justify-between">
              {isEdit ? (
                <button
                  onClick={remove}
                  className="rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/50"
                >
                  删除任务
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
                >
                  取消
                </button>
                <button
                  onClick={submit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
                >
                  {isEdit ? "保存" : "创建"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
