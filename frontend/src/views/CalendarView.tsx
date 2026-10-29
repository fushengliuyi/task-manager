import { useMemo, useState } from "react";
import type { Task } from "../types";

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 周一为一周起始
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export function CalendarView({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit: (id: string) => void;
}) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells = useMemo(() => buildGrid(ym.y, ym.m), [ym]);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks]);

  const unscheduled = useMemo(
    () => tasks.filter((t) => !t.dueDate),
    [tasks],
  );

  const prev = () =>
    setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () =>
    setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {ym.y} 年 {ym.m + 1} 月
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prev}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:border-slate-500"
          >
            上个月
          </button>
          <button
            onClick={next}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:border-slate-500"
          >
            下个月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        {weekdays.map((w) => (
          <div
            key={w}
            className="bg-slate-900 py-2 text-center text-xs text-slate-400"
          >
            周{w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`e${i}`} className="min-h-24 bg-slate-900" />;
          }
          const day = String(date.getDate()).padStart(2, "0");
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${day}`;
          const list = byDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={`min-h-24 bg-slate-900 p-1.5 ${isToday ? "ring-1 ring-inset ring-indigo-500" : ""}`}
            >
              <p className="text-right text-xs text-slate-500">{date.getDate()}</p>
              <div className="mt-1 flex flex-col gap-1">
                {list.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onEdit(t.id)}
                    className="truncate rounded bg-indigo-900/50 px-1.5 py-0.5 text-left text-xs text-indigo-200 hover:bg-indigo-800/60"
                  >
                    {t.title}
                  </button>
                ))}
                {list.length > 3 && (
                  <span className="px-1 text-xs text-slate-500">
                    +{list.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-slate-300">
            未排期（{unscheduled.length}）
          </h3>
          <div className="flex flex-col gap-2">
            {unscheduled.map((t) => (
              <button
                key={t.id}
                onClick={() => onEdit(t.id)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 hover:border-slate-700"
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
