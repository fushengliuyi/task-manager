# 任务管理系统

个人任务管理，同时管理「生成事项」与「工作事项」两类任务。跨设备（Web + 移动端 PWA），
单人使用，数据存 Cloudflare D1（SQLite），由 Cloudflare Access 挡门。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vite + React + TypeScript + Tailwind + TanStack Query，部署 Cloudflare Pages |
| 后端 | Cloudflare Workers + Hono + Drizzle ORM + zod |
| 数据库 | Cloudflare D1（SQLite） |
| 访问控制 | Cloudflare Access（Email OTP） |

## 目录结构

```
worker/     # Cloudflare Workers API
  src/
    index.ts          # Hono 入口 + CORS + 错误处理
    validation.ts     # zod 校验
    db/schema.ts      # Drizzle schema
    db/index.ts       # D1 客户端工厂
    routes/           # tasks / subtasks / tags
  migrations/         # Drizzle 生成的 SQL
frontend/   # React SPA
  src/
    api/              # fetch 封装 + TanStack Query hooks
    components/       # TaskRow / TaskCard / TaskEditor / PriorityBadge
    views/            # ListView / BoardView / CalendarView
    types/            # TS 类型 + 枚举文案
```

## 本地开发

```bash
# 1. 后端
cd worker
npm install
npm run db:migrate:local   # 应用迁移到本地 D1
npm run dev                # Worker 跑在 http://localhost:8787

# 2. 前端（另开终端）
cd frontend
npm install
npm run dev                # Vite 跑在 http://localhost:5173，/api 代理到 8787
```

访问 http://localhost:5173 。

## 部署到 Cloudflare

前置：安装 `wrangler` 并用 `wrangler login` 登录；准备一个自有域名接入 Cloudflare。

1. 创建 D1 数据库并记录 `database_id`：
   ```bash
   cd worker
   wrangler d1 create task-manager-db
   ```
   把返回的 id 填入 `wrangler.jsonc` 的 `d1_databases[0].database_id`。

2. 应用远程迁移：
   ```bash
   npm run db:migrate:remote
   ```

3. 部署 Worker：
   ```bash
   npm run deploy
   ```

4. 部署前端到 Pages：
   ```bash
   cd ../frontend
   npm run build
   wrangler pages deploy dist --project-name task-manager
   ```

5. 配置 Cloudflare Access：在 Zero Trust 建一个 Access 应用覆盖站点与 Worker 路由，
   策略选 Email OTP，允许列表只放本人邮箱。

## API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/tasks` | 列表（支持 category/status/priority/due/tag/q/sort 组合筛选） |
| POST | `/api/tasks` | 创建 |
| GET | `/api/tasks/:id` | 详情（含子任务与标签） |
| PATCH | `/api/tasks/:id` | 局部更新 |
| DELETE | `/api/tasks/:id` | 删除 |
| POST | `/api/tasks/:taskId/subtasks` | 新增子任务 |
| PATCH | `/api/subtasks/:id` | 更新子任务 |
| DELETE | `/api/subtasks/:id` | 删除子任务 |
| GET / POST / DELETE | `/api/tags` | 标签列表 / 新建 / 删除 |
| PUT | `/api/tasks/:id/tags` | 设置任务标签集合 |
