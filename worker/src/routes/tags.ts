import { asc, eq } from "drizzle-orm";
import type { Context, Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { createDB, type AppDB } from "../db";
import { tags } from "../db/schema";
import { createTagSchema } from "../validation";
import { HttpError, uuid } from "../utils";

function db(c: Context): AppDB {
  return createDB(c.env.DB as D1Database);
}

export function registerTagRoutes(app: Hono) {
  // 全部标签
  app.get("/api/tags", async (c) => {
    const rows = await db(c).select().from(tags).orderBy(asc(tags.name));
    return c.json(rows);
  });

  // 新建标签
  app.post("/api/tags", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "INVALID_BODY", parsed.error.issues[0].message);
    }

    const name = parsed.data.name;
    const d = db(c);

    // 同名标签直接返回已存在的
    const [existing] = await d.select().from(tags).where(eq(tags.name, name)).limit(1);
    if (existing) return c.json(existing, 200);

    const [tag] = await d.insert(tags).values({ id: uuid(), name }).returning();
    return c.json(tag, 201);
  });

  // 删除标签（解除关联）
  app.delete("/api/tags/:id", async (c) => {
    const id = c.req.param("id");
    const d = db(c);
    const [existing] = await d.select().from(tags).where(eq(tags.id, id)).limit(1);
    if (!existing) throw new HttpError(404, "NOT_FOUND", "标签不存在");
    await d.delete(tags).where(eq(tags.id, id));
    return c.body(null, 204);
  });
}
