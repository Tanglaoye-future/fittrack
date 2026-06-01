# Claude Code — 项目记忆入口

本仓库的项目记忆**统一维护在以下文件**，请按顺序读取，不要在本文件追加业务内容（避免多处漂移）：

1. [`AGENTS.md`](./AGENTS.md) — 项目身份、冻结决策、文档地图、3 个核心 Loop、工程约定（**先读这个**）
2. [`.cursor/rules/fitflow-pro-project-memory.mdc`](./.cursor/rules/fitflow-pro-project-memory.mdc) — 与 AGENTS.md 同源的精简版，含技术栈速记与最近评审状态
3. [`.cursor/rules/auto-review.mdc`](./.cursor/rules/auto-review.mdc) — 自动评审流程（生成 → 评审 → 修 P0/P1 → commit）

## v2 必读设计文档（改代码前）

| 文件 | 何时读 |
|---|---|
| [`docs/PRD_v2.md`](./docs/PRD_v2.md) | 功能边界、商业模式 |
| [`docs/DATABASE_SCHEMA_v2.md`](./docs/DATABASE_SCHEMA_v2.md) | 任何 Prisma / 迁移改动 |
| [`docs/API_DESIGN_v2.md`](./docs/API_DESIGN_v2.md) | 任何 NestJS 路由 / DTO 改动 |
| [`docs/UX_PRINCIPLES.md`](./docs/UX_PRINCIPLES.md) | 任何前端交互改动（含 §9 PR checklist） |
| [`docs/reviews/`](./docs/reviews/) | 最近评审结论 |

> v1 文档（`docs/DATABASE_SCHEMA.md` / `docs/API_DESIGN.md` 等）**勿作新开发依据**。

## 本地开发速查

- 数据库：`docker compose up -d postgres`（容器 `fitflow-postgres`，宿主端口 **5433**）
- 后端 Nest：`cd backend && npm run start:dev`（http://localhost:3001/api/v1，Swagger 在 `/api/docs`）
- 前端：`cd frontend && npm run dev`（http://localhost:3000）
- Python 分析服务：`cd analytics && .venv/bin/uvicorn analytics.main:app --app-dir src --host 0.0.0.0 --port 3010`（Swagger 在 `/docs`，路由前缀 `/api/v2/analytics`）

### 已踩过的非显性坑（再次部署会复现）

- **`DATABASE_URL` 必须对齐 docker-compose**：`postgresql://fitflow:fitflow123@localhost:5433/fitflow`（端口 5433 不是 5432；数据库名 `fitflow`，**不是** `.env.example` 里的 `fitflow_pro_v2_db`）。`backend/.env` 和 `analytics/.env` 都要按这个写。
- **Nest 启动报 `Cannot find module ...decorator`**：`rm -rf backend/dist` 再起（仓库历史里曾追踪过期 `dist/`，`*.tsbuildinfo` 已通过 `.gitignore` 排除）。
- **Python 分析服务必须用 `--app-dir src` 启动**，**不能裸 `uvicorn analytics.main:app`**。原因：Python 3.14 把以 `__` 开头的 `.pth` 视为隐藏文件直接跳过，而 setuptools 的 PEP 660 editable install 偏偏产物就叫 `__editable__.fitflow_analytics-0.1.0.pth` → `import analytics` 失败。
- **`uvicorn --reload` 在 analytics 目录裸开会监视整个 `.venv`**（启动时探测到几百个 pandas/pygments 文件变更），不要这么跑生产/部署，要么 `--reload-dir src` 限定范围，要么去掉 `--reload`。
- **`JWT_SECRET` 在 Nest 和 Python 服务之间必须一致**（Python 仅验证 token，不签发），`backend/.env` 和 `analytics/.env` 的值要相等，否则前端拿 Nest 登录返回的 token 调分析服务会 401。
- **前端分析请求走独立 baseURL**：`api-client.ts` 导出了 `analyticsClient`，指向 `NEXT_PUBLIC_ANALYTICS_API_URL`（默认 `http://localhost:3010/api/v2`）。改 `NEXT_PUBLIC_*` 后必须**重启** `next dev`，不会热更新。
