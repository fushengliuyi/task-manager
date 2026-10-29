import { useMemo, useState } from "react";
import { useTasks } from "./api/hooks";
import { ListView } from "./views/ListView";
import { BoardView } from "./views/BoardView";
import { CalendarView } from "./views/CalendarView";
import { TaskEditor } from "./components/TaskEditor";
import type { Category, Priority, Status } from "./types";
import { CATEGORY_LABELS } from "./types";

type View = "list" | "board" | "calendar";

export default function App() {
  const [view, setView] = useState<View>("list");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<string>("due_date");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      category: category || undefined,
      status: status || undefined,
      priority: priority || undefined,
      q: q || undefined,
      sort,
    }),
    [category, status, priority, q, sort],
  );

  const { data: tasks = [], isLoading, error } = useTasks(query);

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="mr-2 text-lg font-semibold">任务管理</h1>

          {/* 视图切换 */}
          <nav className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 text-sm">
            {(
              [
                ["list", "列表"],
                ["board", "看板"],
                ["calendar", "日历"],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 transition ${
                  view === v
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* 类型切换 */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">全部类型</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          {/* 状态 / 优先级筛选 */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">全部状态</option>
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | "")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="">全部优先级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
            <option value="none">无</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-sm"
          >
            <option value="due_date">按截止日</option>
            <option value="priority">按优先级</option>
            <option value="created_at">按创建时间</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题/描述…"
            className="min-w-40 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-slate-600"
          />

          <button
            onClick={openCreate}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium hover:bg-indigo-500"
          >
            新建
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading && <p className="text-slate-400">加载中…</p>}
        {error && (
          <p className="text-red-400">加载失败：{(error as Error).message}</p>
        )}
        {!isLoading && !error && view === "list" && (
          <ListView tasks={tasks} onEdit={openEdit} />
        )}
        {!isLoading && !error && view === "board" && (
          <BoardView tasks={tasks} onEdit={openEdit} />
        )}
        {!isLoading && !error && view === "calendar" && (
          <CalendarView tasks={tasks} onEdit={openEdit} />
        )}
      </main>

      {editorOpen && (
        <TaskEditor
          taskId={editingId}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
