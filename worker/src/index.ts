import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerSubtaskRoutes } from "./routes/subtasks";
import { registerTagRoutes } from "./routes/tags";
import { registerTaskRoutes } from "./routes/tasks";
import { HttpError } from "./utils";

const app = new Hono();

// 跨域：本地开发时前端(localhost:5173)访问 Worker(localhost:8787)
// 生产环境同域部署，此配置无副作用。
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

registerTaskRoutes(app);
registerSubtaskRoutes(app);
registerTagRoutes(app);

app.get("/", (c) => c.json({ ok: true, name: "task-manager-api" }));

// 统一错误处理
app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.status as 400 | 404,
    );
  }
  console.error("Unhandled error:", err);
  return c.json(
    { error: { code: "INTERNAL", message: "服务器内部错误" } },
    500,
  );
});

// 404 兜底
app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "接口不存在" } }, 404),
);

export default app;
