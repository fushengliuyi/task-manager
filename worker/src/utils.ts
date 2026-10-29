export function uuid(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}

// 本地时区的 YYYY-MM-DD（服务端渲染搜索/排序时用于比较，仅作字符串比较）
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
