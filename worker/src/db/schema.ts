import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 任务类别：默认两个值，可扩展。对应"生成事项 / 工作事项"两类。
export const CATEGORIES = ["personal", "work"] as const;
export const STATUSES = ["todo", "in_progress", "done"] as const;
export const PRIORITIES = ["none", "low", "medium", "high"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category", { enum: CATEGORIES }).notNull().default("personal"),
    status: text("status", { enum: STATUSES }).notNull().default("todo"),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("none"),
    // 日期粒度，ISO 'YYYY-MM-DD'，可空表示无截止日
    dueDate: text("due_date"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (table) => [
    index("idx_tasks_status").on(table.status),
    index("idx_tasks_category").on(table.category),
    index("idx_tasks_due_date").on(table.dueDate),
    index("idx_tasks_priority").on(table.priority),
  ],
);

export const subtasks = sqliteTable("subtasks", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.tagId] })],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
