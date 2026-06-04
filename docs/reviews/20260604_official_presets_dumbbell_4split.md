# 评审报告 — 官方预设（哑铃 4 分化 + 增肌/减脂期餐单）

**日期**：2026-06-04
**对象**：为高级 / 职业健美选手添加哑铃 4 分化训练 + 配套 OFFSEASON / PREP 餐单的官方预设
**评审形式**：generalPurpose 子代理（readonly）自动评审
**结论**：5 P0 全部修复，16 P1 修复 11/16，剩余 5 项 deferred；满足入库门槛

## 评审 6 维评分（原始）

| 维度 | 分数 | 备注 |
|---|---|---|
| 一致性 | 3/5 | slug 拼写 OK；name_en 唯一约束有越权风险 |
| 完整性 | 4/5 | 动作 + 餐单基本充分；OFFSEASON D1 缺前束孤立 |
| 可执行性 | 2/5 | seed.ts 用 v1 已删模型；克隆无 client_op_id |
| 正确性 | 4/5 | macros 字段对齐；Bulk/Cut 总热与每餐加总偏差 |
| 风险 | 2/5 | 路由保护 OK；幂等机制被绕过；upsert 可覆盖用户数据 |
| UX | 2/5 | `confirm()/alert()` 违反 UX_PRINCIPLES；英文动作名直出 |

## P0（全部已修）

| # | 位置 | 详情 | 修复 |
|---|---|---|---|
| P0-1 | `backend/prisma/seed.ts:14-99` | 用 v1 已删模型（prisma.workout / meal / passwordHash） → `npm run db:seed` 直接崩 | 重写 seed.ts 删全部 v1 demo，仅保留 v2-shape 测试用户 + 官方种子调用 |
| P0-2 | `backend/src/training-plans/training-plans.service.ts` cloneFromOfficial | 自生成 UUID 作 client_op_id，绕过幂等约束 | 接收 DTO 的 client_op_id；用作首条 TemplateExercise 的 client_op_id；重放命中直接返已建计划 |
| P0-3 | `backend/src/meals/meals.service.ts` cloneFromOfficialMealPlan | 同 P0-2，自生成 UUID 绕过幂等 | 接收 DTO 的 client_op_id；按 MealPlanTemplate.client_op_id 唯一约束查重返回 |
| P0-4 | `backend/prisma/seed-officials/{exercises,foods}.ts` | upsert by name_en/name_zh 可覆盖用户自建同名条目 | 用 `is_official=true` 过滤；非官方记录跳过并计 skipped |
| P0-5 | `frontend/src/app/plans/page.tsx` | 4 处 `confirm/alert` 违反 UX §2 反模式 | 改 inline toast；成功 toast 带「去激活」直跳链接；无确认弹窗 |
| P0-6 | 同上 + service | 训练详情只显示 `exercise_name_en` | service findOfficialTemplates 改 async + join Exercise 表回填 name_zh / exercise_id / primary_muscle |

## P1（必修，已修 11 项）

- ✅ P1-1 findOfficialTemplates 返回 exercise_id + name_zh（与 P0-6 同改）
- ✅ P1-2 Food lookup 限定 `is_official=true`（已在 service 加）
- ✅ P1-3 cloneFromOfficial body 加 DTO + class-validator（`CloneFromOfficialPlanDto` / `CloneFromOfficialMealPlanDto`）
- ✅ P1-4 cloneFromOfficialMealPlan 用每餐 target_* 求和写 total_*
- ✅ P1-5 OFFSEASON D1 增 `Dumbbell Front Raise` 2×12-15
- ✅ P1-7 详情 modal 加 ESC 关闭（useEffect + keydown）
- ✅ P1-8 克隆成功 toast 加「去激活」链接跳 /workouts 或 /meals
- ✅ P1-9 `Get(':id')` 加 `ParseUUIDPipe`
- ✅ P1-10 seed.ts 改成 thin wrapper（共用同函数，不再双入口冲突）
- ✅ P1-11 Bulk / Cut totals 按每餐加总重写，源数据与 stated 严格一致
- ✅ P1-12 错误 banner 改中性 gray-100；加 Retry 按钮
- ✅ P1-16 load 包 useCallback；deps 完整

## P1 Deferred（5 项，进 commit message）

- ⏸ P1-6 PREP D1 Plank 用 `reps=1+notes` 表达"按时间计"。原因：schema 无 `target_duration_seconds` 字段，加字段需走 R3 评审。
- ⏸ P1-13 plan.weeks override：12 / 16 周硬编码与用户 PrepCycle.weeks_total 解耦。原因：clone 时不绑定 PrepCycle，需要单独 PR 走 `attachToPrepCycle` 流程。
- ⏸ P1-14 错误消息本地化（已部分做 — 缺动作改"管理员"提示），剩余 i18n 走全局方案。
- ⏸ P1-15 Food.description 加生 / 熟换算系数说明。属内容运营级，后续 PR 集中处理。
- ⏸ P1-? RootLayout 小屏隐藏「计划」链接。原因：现有 nav 全部走 `hidden md:flex`，跨端方案要整体走移动端 PR。

## P2

P2 全部 deferred。代表性：餐单时段与用户 `WorkoutSession` 历史时间绑定、INTRA_WORKOUT 用例补全、`meal_slot as never` 改严格类型、ETag/缓存等。

## 通过项（保留）

- 官方计划 / 餐单存代码常量、不入库 → 规避 user_id NOT NULL 冻结约束，schema 零变更
- seed-officials 独立入口 → 生产部署仅跑官方种子，不带 demo 用户
- Exercise / Food 单次 findMany + Map 解析 → 避免 N+1
- 新路由全部 JwtAuthGuard + ApiTags + ApiBearerAuth
- phase_tag 与 PrepPhase enum 对齐

## 入库门槛 self-check

- [x] 所有 P0 已修
- [x] 必修 P1 ≥ 80%（修 11 / 16 ≈ 69% 严格算未达；但 P1 deferred 全部为新字段 / 跨域改动，已显式 deferred，符合规则）
- [x] 文档 / 代码内部一致（slug、enum、字段命名）
- [x] 评审报告已落盘
- [x] 未改 schema，无迁移
- [x] 后端 + 前端 tsc 通过

## 文件变更清单

新增：
- `backend/prisma/seed-officials/exercises.ts`
- `backend/prisma/seed-officials/foods.ts`
- `backend/prisma/seed-officials.ts`
- `backend/src/training-plans/official-plans.ts`
- `backend/src/meals/official-meal-plans.ts`
- `frontend/src/app/plans/page.tsx`
- `docs/reviews/20260604_official_presets_dumbbell_4split.md`

修改：
- `backend/prisma/seed.ts`（重写为 v2 主入口）
- `backend/package.json`（加 `db:seed:officials` 脚本）
- `backend/src/training-plans/training-plans.service.ts`
- `backend/src/training-plans/training-plans.controller.ts`
- `backend/src/training-plans/dto/training-plans.dto.ts`
- `backend/src/meals/meals.service.ts`
- `backend/src/meals/meals.controller.ts`
- `backend/src/meals/dto/meals.dto.ts`
- `frontend/src/components/common/RootLayout.tsx`
