import type { Priority } from "../types";
import { PRIORITY_LABELS } from "../types";

const STYLES: Record<Priority, string> = {
  none: "bg-slate-800 text-slate-400",
  low: "bg-sky-900/60 text-sky-300",
  medium: "bg-amber-900/60 text-amber-300",
  high: "bg-rose-900/60 text-rose-300",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
