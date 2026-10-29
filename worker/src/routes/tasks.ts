import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Context, Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { createDB, type AppDB } from "../db";
import { subtasks, tags as tagsTable, taskTags, tasks } from "../db/schema";
import {
  createTaskSchema,
  listTasksQuerySchema,
  setTaskTagsSchema,
  updateTaskSchema,
} from "../validation";
import { HttpError, now, todayISO, uuid } from "../utils";

// 从请求上下文取 D1 绑定并包装为 Drizzle 客户端
function db(c: Context): AppDB {
  return createDB(c.env.DB as D1Database);
}

// 排序映射：sort 参数 -> 排序表达式
function sortExpr(sort: string | undefined) {
  switch (sort) {
    case "priority": {
      const rank = sql`CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END`;
      return [asc(rank), asc(tasks.dueDate), desc(tasks.createdAt)] as const;
    }
    case "created_at":
      return [desc(tasks.createdAt)] as const;
    case "due_date":
    default:
      // 无截止日的排到最后
      return [
        asc(sql`CASE WHEN ${tasks.dueDate} IS NULL THEN 1 ELSE 0 END`),
        asc(tasks.dueDate),
        desc(tasks.createdAt),
      ] as const;
  }
}

// 详情聚合：任务 + 子任务 + 标签
async function taskWithRelations(db: AppDB, id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) return null;

  const subs = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, id))
    .orderBy(asc(subtasks.sortOrder), asc(subtasks.createdAt));

  const tagRows = await db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(taskTags)
    .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
    .where(eq(taskTags.taskId, id))
    .orderBy(asc(tagsTable.name));

  return { ...task, subtasks: subs, tags: tagRows };
}

export function registerTaskRoutes(app: Hono) {
  // 列表 + 组合筛选 + 搜索
  app.get("/api/tasks", async (c) => {
    const parsed = listTasksQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_QUERY", parsed.error.issues[0].message);
    }
    const { category, status, priority, due, tag, q, sort } = parsed.data;
    const d = db(c);

    const conds = [];
    if (category) conds.push(eq(tasks.category, category));
    if (status) conds.push(eq(tasks.status, status));
    if (priority) conds.push(eq(tasks.priority, priority));

    const today = todayISO();
    if (due === "today") conds.push(eq(tasks.dueDate, today));
    else if (due === "overdue") {
      conds.push(sql`${tasks.dueDate} IS NOT NULL`);
      conds.push(sql`${tasks.dueDate} < ${today}`);
    } else if (due === "upcoming") {
      conds.push(sql`${tasks.dueDate} IS NOT NULL`);
      conds.push(sql`${tasks.dueDate} >= ${today}`);
    } else if (due === "none") {
      conds.push(sql`${tasks.dueDate} IS NULL`);
    }

    if (q) {
      const pattern = `%${q}%`;
      conds.push(or(like(tasks.title, pattern), like(tasks.description, pattern)));
    }

    if (tag) {
      // 支持按标签 id 或 name 过滤
      const tagCond = or(eq(taskTags.tagId, tag), eq(tagsTable.name, tag));
      const taskIds = await d
        .select({ id: taskTags.taskId })
        .from(taskTags)
        .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
        .where(tagCond);
      if (taskIds.length === 0) return c.json([]);
      conds.push(inArray(tasks.id, taskIds.map((r) => r.id)));
    }

    const rows = await d
      .select()
      .from(tasks)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(...sortExpr(sort));

    return c.json(rows);
  });

  // 创建
  app.post("/api/tasks", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }
    const data = parsed.data;
    const id = uuid();
    const t = now();
    const [task] = await db(c)
      .insert(tasks)
      .values({
        id,
        title: data.title,
        description: data.description ?? "",
        category: data.category ?? "personal",
        status: data.status ?? "todo",
        priority: data.priority ?? "none",
        dueDate: data.dueDate ?? null,
        createdAt: t,
        updatedAt: t,
        completedAt: data.status === "done" ? t : null,
      })
      .returning();
    return c.json(task, 201);
  });

  // 详情
  app.get("/api/tasks/:id", async (c) => {
    const task = await taskWithRelations(db(c), c.req.param("id"));
    if (!task) throw new HttpError(404, "NOT_FOUND", "任务不存在");
    return c.json(task);
  });

  // 更新
  app.patch("/api/tasks/:id", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }
    const data = parsed.data;
    const id = c.req.param("id");

    const [existing] = await db(c).select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "任务不存在");

    const patch: Record<string, unknown> = { updatedAt: now() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.category !== undefined) patch.category = data.category;
    if (data.status !== undefined) {
      patch.status = data.status;
      patch.completedAt =
        data.status === "done" ? existing.completedAt ?? now() : null;
    }
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.dueDate !== undefined) patch.dueDate = data.dueDate;

    const [updated] = await db(c)
      .update(tasks)
      .set(patch)
      .where(eq(tasks.id, id))
      .returning();
    return c.json(updated);
  });

  // 删除（级联删子任务与标签关联）
  app.delete("/api/tasks/:id", async (c) => {
    const id = c.req.param("id");
    const [existing] = await db(c).select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "任务不存在");
    await db(c).delete(tasks).where(eq(tasks.id, id));
    return c.body(null, 204);
  });

  // 设置任务标签集合
  app.put("/api/tasks/:id/tags", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = setTaskTagsSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }

    const [existing] = await db(c).select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "任务不存在");

    const { tagIds } = parsed.data;
    const d = db(c);
    await d.delete(taskTags).where(eq(taskTags.taskId, id));
    if (tagIds.length > 0) {
      await d.insert(taskTags).values(tagIds.map((tagId) => ({ taskId: id, tagId })));
    }
    return c.body(null, 204);
  });
}
