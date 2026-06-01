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
- 后端：`cd backend && npm run start:dev`（http://localhost:3001/api/v1，Swagger 在 `/api/docs`）
- 前端：`cd frontend && npm run dev`（http://localhost:3000）
- `DATABASE_URL` 必须对齐 docker-compose：`postgresql://fitflow:fitflow123@localhost:5433/fitflow`
- 首次启动若报 `Cannot find module ...decorator`，清掉 `backend/dist` + `backend/tsconfig.tsbuildinfo` 再起（仓库带了过期产物）
