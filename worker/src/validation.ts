import { z } from "zod";
import { CATEGORIES, PRIORITIES, STATUSES } from "./db/schema";

// 任务创建/更新共享字段
export const taskFields = {
  title: z.string().trim().min(1, "标题不能为空").max(200, "标题过长"),
  description: z.string().max(5000, "描述过长").optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "截止日必须是 YYYY-MM-DD")
    .nullable()
    .optional(),
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description,
  category: taskFields.category,
  status: taskFields.status,
  priority: taskFields.priority,
  dueDate: taskFields.dueDate,
});

export const updateTaskSchema = z
  .object({ ...taskFields, title: taskFields.title.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "至少提供一个字段" });

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, "子任务标题不能为空").max(200),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "标签名不能为空").max(50, "标签名过长"),
});

export const setTaskTagsSchema = z.object({
  tagIds: z.array(z.string()).max(50, "标签过多"),
});

export const listTasksQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  due: z.enum(["today", "overdue", "upcoming", "none"]).optional(),
  tag: z.string().optional(),
  q: z.string().max(200).optional(),
  sort: z.enum(["due_date", "priority", "created_at"]).optional(),
});
