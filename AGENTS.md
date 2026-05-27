# FitFlow Pro — AI 项目记忆（AGENTS）

> 本文件与 `.cursor/rules/fitflow-pro-project-memory.mdc` 是**项目级持久记忆**。
> 在本仓库内与 AI 对话时，应优先读取此处与 v2 文档，勿按 v1 通用健身 App 理解需求。

---

## 项目是什么

- **名称**：FitFlow Pro（仓库目录 `fittrack`）
- **定位**：职业健美运动员的「备赛操作系统」——训练、饮食、消费、备赛周期、教练协同，**降低认知负荷**为第一原则
- **客户端**：Next.js **PWA**（离线优先、可装桌面）
- **后端**：NestJS + PostgreSQL + Prisma
- **阶段**：v1 已停；**v2 设计已评审入库（R2）**，待 W2 起落地 schema / API

---

## 已冻结的战略决策（勿擅自推翻）

| 决策 | 内容 |
|---|---|
| 数据模型 | v1 **完全重写**；独立 schema / migration `20260603000000_v2_init` |
| 教练 | **MVP 含教练域**（W9）；模块级 `scope_*` 权限；Athlete Pro 同时仅 1 名 ACTIVE 教练 |
| PED 模块 | 完整周期/剂量/血检；**私域**；运动员 PIN；教练走 `ControlledViewToken`（非 PIN） |
| 商店版 | `app.fitflow.pro` tree-shake 受控模块；专业 PWA 在 `pro.fitflow.pro` |
| 离线 | 写表带 `client_op_id` + `client_ts`；父子表幂等见 SCHEMA §0.1 |
| 计划餐 | `MealPlanTemplate` + `ScheduledMeal`；一键打卡 `scheduled_meal_id` |
| 默认值 | `LastValueCache` 支撑「昨天怎么做今天就怎么做」 |

---

## 文档地图（单一事实来源）

| 用途 | 路径 |
|---|---|
| 产品 | `docs/PRD_v2.md` |
| UX 强约束 | `docs/UX_PRINCIPLES.md`（§9 PR checklist） |
| 数据库 | `docs/DATABASE_SCHEMA_v2.md` |
| API | `docs/API_DESIGN_v2.md` |
| 排期 | `docs/PROJECT_TIMELINE_v2.md` |
| 自动评审流程 | `docs/REVIEW_PROCESS.md` |
| 评审归档 | `docs/reviews/README.md` |
| v1 历史 | `docs/DATABASE_SCHEMA.md` 等 — **勿作新开发依据** |

---

## 三个核心 Loop（实现优先级）

1. **Loop A 训练**：Session → Exercise → Set；单组打卡 ≤ 5s；`suggested_sets` 来自 `LastValueCache`
2. **Loop B 饮食**：今日计划餐 1 click；macros **零数学**（服务端算）
3. **Loop C 周 Check-in**：周日预填 + 4 角度照；教练红黄绿看板 + macros/训练调整下发

---

## 工程约定

- **新代码/文档**：生成后 **自动评审 → 修 P0/必修 P1 → 再 commit**（见 `.cursor/rules/auto-review.mdc`）
- **Commit**：用户未明确要求时不要 push；commit message 含 `Reviewed by` + 评审报告路径
- **UX**：任何 PR 对照 `UX_PRINCIPLES.md` §9；变多点击/变多思考即砍
- **受控数据**：不进 `/expenses`、不进 `/system/export/full`；用 `ControlledExpense` + `/controlled/*`

---

## 最近评审状态（2026-05-27）

- R1：8 P0 + 22 P1 + 10 P2 → 已全部在 R2 文档修订中处理
- R2 self-check：**8/8 P0、17/17 必修 P1 通过** → commit `117aa99`
- **Deferred**：P1-20 PEAK 业务细节（W8）、P1-24 照片 BackgroundFetch（W11）、P1-27 双 host ops（W12）；P2-31~40 后续 PR

---

## 对 AI 的行为要求

1. 开工前先扫 `docs/*_v2.md` 与本文，避免与 v1 脚手架假设冲突
2. 改 schema/API 时同步改 PRD/另一份设计文档，并 grep 全库消 stale 引用
3. 不询问「要不要评审」——按 `auto-review.mdc` 自动执行
4. 用户说「先不评审」或「直接 commit」时可跳过评审流程

**Last updated**: 2026-05-27
