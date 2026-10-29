import { asc, eq } from "drizzle-orm";
import type { Context, Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { createDB, type AppDB } from "../db";
import { subtasks, tasks } from "../db/schema";
import { createSubtaskSchema, updateSubtaskSchema } from "../validation";
import { HttpError, now, uuid } from "../utils";

function db(c: Context): AppDB {
  return createDB(c.env.DB as D1Database);
}

export function registerSubtaskRoutes(app: Hono) {
  // 新增子任务
  app.post("/api/tasks/:taskId/subtasks", async (c) => {
    const taskId = c.req.param("taskId");
    const d = db(c);

    const [task] = await d.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) throw new HttpError(404, "NOT_FOUND", "任务不存在");

    const body = await c.req.json().catch(() => null);
    const parsed = createSubtaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }

    const id = uuid();
    const [sub] = await d
      .insert(subtasks)
      .values({
        id,
        taskId,
        title: parsed.data.title,
        done: false,
        sortOrder: parsed.data.sortOrder ?? 0,
        createdAt: now(),
      })
      .returning();
    return c.json(sub, 201);
  });

  // 更新子任务（改标题 / 切换完成 / 改排序）
  app.patch("/api/subtasks/:id", async (c) => {
    const id = c.req.param("id");
    const d = db(c);

    const [existing] = await d.select().from(subtasks).where(eq(subtasks.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "子任务不存在");

    const body = await c.req.json().catch(() => null);
    const parsed = updateSubtaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }
    const { title, done, sortOrder } = parsed.data;

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (done !== undefined) patch.done = done;
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, "INVALID_BODY", "至少提供一个字段");
    }

    const [updated] = await d
      .update(subtasks)
      .set(patch)
      .where(eq(subtasks.id, id))
      .returning();
    return c.json(updated);
  });

  // 删除子任务
  app.delete("/api/subtasks/:id", async (c) => {
    const id = c.req.param("id");
    const d = db(c);

    const [existing] = await d.select().from(subtasks).where(eq(subtasks.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "子任务不存在");
    await d.delete(subtasks).where(eq(subtasks.id, id));
    return c.body(null, 204);
  });
}
