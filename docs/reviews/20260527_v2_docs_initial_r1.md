# FitFlow Pro v2 — 设计文档评审报告（R1）

**评审日期**: 2026-05-27  
**评审对象**: PRD_v2.md / UX_PRINCIPLES.md / DATABASE_SCHEMA_v2.md / API_DESIGN_v2.md / PROJECT_TIMELINE_v2.md  
**评审性质**: 独立 Reviewer，严格挑刺式  
**Reviewer**: subagent `ac3f904c`  
**结论**: 通过待修复（8 P0 阻塞 + 22 P1 影响开发 + 10 P2 建议）

---

## 总评

- **总分：C+（接近 B-）**
- **建议：通过待修复**

整体设计方向正确、行业理解到位（Loop A/B/C、备赛周期、PED 分发策略思路清晰），但**文档之间的字段/实体对齐不严**，多处"PRD 承诺—UX 要求—SCHEMA 实体—API 接口"四方对不上。最关键的几处缺失会让开发同学在 W2–W6 直接撞墙。

---

## 每份文档评分

| 文档 | 一致性 | 完整性 | 可执行性 | 正确性 | 风险 | UX 合规 |
|---|---|---|---|---|---|---|
| PRD_v2.md | B | B | B | A | B | A |
| UX_PRINCIPLES.md | A | A | B | A | A | A |
| DATABASE_SCHEMA_v2.md | **C** | **C** | B | B | **C** | **C** |
| API_DESIGN_v2.md | **C** | **C** | B | B | B | B |
| PROJECT_TIMELINE_v2.md | B | B | B | A | B | A |

SCHEMA 与 API 是最大短板——它们要承接 PRD 与 UX 的所有承诺，但目前**有承诺、没实体**的地方至少 6 处，需要硬修。

---

## 发现的问题（按优先级排序）

### P0（必须修，阻塞开发）

#### P0-1. "今日计划餐"在 schema 中没有实体——Loop B 主干断裂
- **出现位置**：`PRD_v2.md` §3 Loop B / `API_DESIGN_v2.md` §8（`/meals/planned/today`、`/meals/quick-log` 的 `planned_meal_id`）/ `DATABASE_SCHEMA_v2.md` 全文
- **问题详情**：PRD Loop B 描述"今日 5 餐计划已就绪（基于备赛 Week 8 macros：3200kcal / 250P / 350C / 80F）"；API 中 `POST /meals/quick-log` 的关键参数是 `planned_meal_id`，且 `GET /meals/planned/today` 必须返回"今日计划餐"。但 SCHEMA 中**没有任何 `MealPlan / MealPlanTemplate / ScheduledMeal` 实体**，只有 `MealLog.is_planned: Boolean` 这个标志位。`is_planned` 只能记录"这餐是按计划吃的"，无法回答"今天应该吃哪 5 餐、每餐用哪个 recipe、什么时间"。这是 UX §1.3（一键打卡 1 click ≤ 3s）和 §1.6（批量胜过单条）能否实现的物理基础。
- **修复建议**：新增 `MealPlanTemplate`（与 `PhaseConfig` 关联）+ `ScheduledMeal`（meal_slot, target_time, recipe_id/items, target_kcal, target_macros）；API `/meals/quick-log` 接收 `scheduled_meal_id` 后由服务端 fan-out 写入 `MealLog + MealItem`。

#### P0-2. `CoachComment` 多态外键无法工作（Prisma 会编译失败/破坏完整性）
- **出现位置**：`DATABASE_SCHEMA_v2.md` §10.3
- **问题详情**：`target_type` 枚举包含 `CHECK_IN / SESSION / MEAL / PHOTO / BODY_RECORD` 五类，但 Prisma 关系只声明了一条：`check_in WeeklyCheckIn? @relation(fields: [target_id], references: [id])`。Prisma **不支持原生多态外键**：要么 `target_id` 是 `WeeklyCheckIn.id` 的 FK（其他四类全部破坏 RI），要么这条关系会编译错误。
- **修复建议**：要么拆成 5 张表（`CommentOnCheckIn / CommentOnSession / …`），要么不要 FK 关系（`target_id` 只做应用层关联，去掉 `check_in` 关系字段），并接受失去 RI 与级联删除——必须**显式**在文档里说明选择。

#### P0-3. `WeeklyCheckIn.photos` 反向关系断了——Prisma 编译失败
- **出现位置**：`DATABASE_SCHEMA_v2.md` §8.4 / §7.2
- **问题详情**：`WeeklyCheckIn` 声明了 `photos ProgressPhoto[] @relation("CheckInPhotos")`，但 `ProgressPhoto` 模型里**没有**对应的 `weekly_check_in_id` + `@relation("CheckInPhotos")` 反向字段，Prisma 必然报 schema invalid。
- **修复建议**：在 `ProgressPhoto` 加 `weekly_check_in_id String?` + `weekly_check_in WeeklyCheckIn? @relation("CheckInPhotos", fields: [weekly_check_in_id], references: [id])`。

#### P0-4. 教练访问 PED 的流程在文档里互相打架
- **出现位置**：`DATABASE_SCHEMA_v2.md` §14.3 / §10.2 / `API_DESIGN_v2.md` §16
- **问题详情**：
  - §10.2 说 `CoachAthleteLink.scopes.controlled = true` → 教练可读
  - §14.3 又说"教练访问：仅当 scope.controlled == true（双重确认）"
  - 但 §16 所有 `/controlled/*` 路由**强制**校验 `X-Controlled-PIN` session token，且 PIN 是运动员本人设的（§14.1）
  - **结论**：即使 scope 给了 controlled = true，教练也没办法获得运动员的 PIN，永远拿不到 session token，因此 scope.controlled 是死字段。
- **修复建议**：明确两条流程之一——(a) 教练有独立的 coach session token 路径，校验 link 而非 PIN；(b) 运动员授权时显式生成"coach-readable 受控视图"（脱敏快照，不走 PIN）。同时所有"教练访问受控数据"的请求**必须**写 `audit_logs` 并通知运动员。

#### P0-5. UX 准则 1（"昨天怎么做今天就怎么做"）没有 schema 支撑
- **出现位置**：`UX_PRINCIPLES.md` §1 准则 1、§7 / `API_DESIGN_v2.md` §5.1（`suggested_sets` 字段）/ `DATABASE_SCHEMA_v2.md` 全文
- **问题详情**：UX §7 明确写"写时记录 last_values 缓存到 user_preferences"，但 SCHEMA 没有任何 `user_preferences / last_values` 表。API `POST /workouts/sessions/start` 的响应里直接返回 `suggested_sets`，但其来源（是查 `SetEntry` 历史聚合？还是查缓存？）没在 SCHEMA 或 API 文档里说明。这是 UX 第 1 条准则能否落地的关键。
- **修复建议**：新增 `UserDefaults`（或 `LastValueCache`）实体，明确"按 (user_id, exercise_id, set_index) 维度缓存最后值"，并在 SetEntry 写入后 trigger 更新；API 文档说明 `/workouts/sessions/start` 的 `suggested_sets` 来自该缓存。

#### P0-6. 大批"用户写入型"子表缺少 `client_op_id`——离线幂等保证破洞
- **出现位置**：`DATABASE_SCHEMA_v2.md` §0 通用约定 vs §5.2 `RecipeIngredient`、§5.3 `MealItem`、§5.4 `WaterLog`/`ElectrolyteLog`（除 client_op_id 外其余共用字段也缺）、§6.1 `SupplementSchedule/Item`、§8.1-8.3 `CompetitionGoal/PrepCycle/PhaseConfig`、§9.2 `BudgetMonth/RecurringExpense`、§10.3 `CoachComment`、§14.2 `ControlledCycle/ControlledProtocolItem/BloodworkResult`
- **问题详情**：§0 设计原则 1 写"**所有**用户写入型表都含 `client_op_id`（UUID, UNIQUE）+ `client_ts`"。但上述十余张表全部缺失。其中：
  - `MealItem` / `RecipeIngredient` 是高频离线打卡的核心写表（用户在健身房后微调克数）
  - `BloodworkResult` 离线场景虽少，但作为写接口仍须幂等
  - `WaterLog` / `ElectrolyteLog` **甚至连 `created_at / updated_at / deleted_at` 都没有**
- **修复建议**：所有 POST/PATCH 接口对应的表都加上完整通用字段；若决定子表不带 op_id（由父表负责），必须在 §0 写明"父子写操作的幂等以父表 op_id 为准 + 服务端做 cascade upsert"，并相应改 API 文档（例 `POST /meals/:id/items` 的幂等键要么继承，要么单列）。

#### P0-7. `CoachInvitation`、`ControlledPinSession`、`RefreshToken` 都是 API 引用但 schema 不存在的实体
- **出现位置**：`API_DESIGN_v2.md` §14（`/coach/invitations`、`invite_code`）/ §16（PIN session token）/ §1（`/auth/refresh`、`/auth/logout`）
- **问题详情**：
  - 教练端 `POST /coach/invitations` 要生成 `invite_code` + `POST /coach-links/accept` 要核验——SCHEMA 没有 `CoachInvitation` 表
  - `POST /controlled/pin/verify` 返回 session token（5 min 有效）——SCHEMA 既无表也未说明用 Redis
  - `/auth/refresh` 和 `/auth/logout`（销毁 refresh token）——SCHEMA 没有 `RefreshToken` 表，又没说"无状态 JWT 不可吊销"。若无表，退出登录 = 谎言。
- **修复建议**：分别补上 3 张表（或显式说明存储介质：Redis + TTL），并把 token 撤销策略写入 API §1。

#### P0-8. `ExpenseCategory.CONTROLLED` 走的是普通 expenses 接口，绕过 PED 隔离
- **出现位置**：`DATABASE_SCHEMA_v2.md` §9.1 / §14（PED 隔离原则）/ `API_DESIGN_v2.md` §13
- **问题详情**：§14.2 说"所有受控数据**不进**普通报表 API"，但 `expenses` 表把 `CONTROLLED` 当成一个普通枚举分类，且 `GET /expenses?category=CONTROLLED` 完全可达，不需要 PIN session。导出报表（`/system/export/full`）也会顺手把它带走。这等于把"我买了多少药"放在普通收据里，与 PRD §5.5 的合规承诺直接冲突。
- **修复建议**：要么把 `CONTROLLED` 从 `ExpenseCategory` 移除，新增 `ControlledExpense` 子表放在受控模块；要么在所有 expense 读接口与导出接口里**强制**过滤 CONTROLLED，并要求 PIN session 才返回（同时在 schema 明确这条规则）。

---

### P1（应该修，影响开发）

#### P1-9. `SetEntry` 缺 `user_id`、`updated_at`、`deleted_at`，违反 §0 自定原则
- **位置**：`DATABASE_SCHEMA_v2.md` §0 + §4.7
- **修复**：补字段，按 `(user_id, session_date)` 加索引，统一软删策略。

#### P1-10. 食材中文全文索引用 `'simple'` tokenizer 不会工作
- **位置**：`DATABASE_SCHEMA_v2.md` §13 索引
- **修复**：改 `gin(name_zh gin_trgm_ops)` 或装 pg_jieba；W2 验证。

#### P1-11. `CoachAthleteLink.scopes` 是模块级，不是 PRD 承诺的"字段级权限"
- **位置**：`PRD_v2.md` §5.4 vs `DATABASE_SCHEMA_v2.md` §10.2
- **修复**：把 PRD"字段级"改"模块级"，统一措辞。

#### P1-12. SubscriptionTier 不能承载 PRD 商业模式
- **位置**：`PRD_v2.md` §6.1 / `DATABASE_SCHEMA_v2.md` §3.1
- **修复**：补 `Subscription / SubscriptionSeat / Invoice` 表，统一席位数字。

#### P1-13. PRD"Athlete Pro 仅可关联 1 名教练"无强制
- **位置**：`PRD_v2.md` §6.1 / `DATABASE_SCHEMA_v2.md` §10.2
- **修复**：service 层加门控 + partial unique 索引。

#### P1-14. Coach 看板"红黄绿"状态判定规则缺失
- **位置**：`API_DESIGN_v2.md` §14.1 / `PROJECT_TIMELINE_v2.md` W9
- **修复**：补判定规则（≥3 条）写入 API §14.1。

#### P1-15. PR 自动追踪缺算法
- **位置**：`DATABASE_SCHEMA_v2.md` §4.8 / `API_DESIGN_v2.md` §5.4
- **修复**：标明 Epley 公式 + 选举规则。

#### P1-16. ROI 报表里的"净增肌 kg"无数据源
- **位置**：`API_DESIGN_v2.md` §13
- **修复**：定义公式 + 时间窗 + 是否含 CONTROLLED。

#### P1-17. 关键 schema 时间不一致
- **位置**：`DATABASE_SCHEMA_v2.md` §15 vs `PROJECT_TIMELINE_v2.md` W2
- **修复**：统一为 `20260603_v2_init`。

#### P1-18. `PrepCycle.weeks_remaining` 不该存
- **位置**：`DATABASE_SCHEMA_v2.md` §8.2
- **修复**：删字段，运行时算。

#### P1-19. 推送提醒规则没有调度实体
- **位置**：`UX_PRINCIPLES.md` §1.5 / `API_DESIGN_v2.md` §17 / `DATABASE_SCHEMA_v2.md` §12
- **修复**：补 `ReminderRule(user_id, type, schedule_expr, channel, enabled)` 并暴露 CRUD。

#### P1-20. PEAK week 自动激活与协议模板没落地
- **位置**：`UX_PRINCIPLES.md` §1.5 / `PROJECT_TIMELINE_v2.md` W8
- **修复**：定义 `PeakProtocolTemplate` 实体 + 状态机变化。

#### P1-21. 教练为学员"下发训练调整"路径缺失
- **位置**：`PRD_v2.md` §3 Loop C vs `API_DESIGN_v2.md` §14
- **修复**：要么 PRD 收口，要么补 `/coach/athletes/:id/training-adjustment`。

#### P1-22. `WorkoutSession` 不 unique 但 `/today` 假设唯一
- **位置**：`DATABASE_SCHEMA_v2.md` §4.5 / `API_DESIGN_v2.md` §5.1
- **修复**：返回数组；或改名 `/today/current`。

#### P1-23. PIN 暴力破解防御缺失
- **位置**：`API_DESIGN_v2.md` §16
- **修复**：PIN ≥ 6 位 + 5 次错锁 15min + 邮件通知。

#### P1-24. 照片上传的离线处理空白
- **位置**：`UX_PRINCIPLES.md` §1.7 / `API_DESIGN_v2.md` §10.1
- **修复**：定义本地暂存 + BackgroundFetch 重传 + presigned URL 续签接口。

#### P1-25. `audit_logs` 用户不可见、无导出
- **位置**：`DATABASE_SCHEMA_v2.md` §12.3 / `API_DESIGN_v2.md` §17
- **修复**：加 `GET /users/me/audit-logs` 与 `GET /controlled/access-history`。

#### P1-26. `meal_logs.total_*` 缓存的失效流程未规定
- **位置**：`DATABASE_SCHEMA_v2.md` §5.3
- **修复**：补"缓存失效矩阵"。

#### P1-27. 商店分发版的"tree-shake"在 PWA 场景下不严密
- **位置**：`DATABASE_SCHEMA_v2.md` §14.4 / `PROJECT_TIMELINE_v2.md` W10
- **修复**：明确两套构建 + 不同 host。

#### P1-28. 北极星指标"完整记录"未定义
- **位置**：`PRD_v2.md` §7
- **修复**：补"完整日"定义 + `DailySummary.is_complete` 字段。

#### P1-29. JSON 类型滥用
- **位置**：`DATABASE_SCHEMA_v2.md` `scopes / per_category_budget / coach_adjustment`
- **修复**：scopes 拆 booleans；budget 拆子表；coach_adjustment 展开为列。

#### P1-30. `MealItem` 没有 `food_id XOR recipe_id` 约束
- **位置**：`DATABASE_SCHEMA_v2.md` §5.3
- **修复**：加 CHECK 约束。

---

### P2（建议修）

- **P2-31** Lighthouse PWA 指标已过期 → 改 Core Web Vitals
- **P2-32** PhotoPose 未覆盖 Bikini / Wellness / Physique → 扩展枚举或字典表
- **P2-33** Tempo 无格式校验 → 服务端正则
- **P2-34** PED 化合物仅英文 → 改字典表
- **P2-35** FREE 档"30 天数据保留"无机制 → 加 retention 字段或延后
- **P2-36** MealSlot 10 项过多 → 合并到 ≤ 7
- **P2-37** WaterLog / ElectrolyteLog 缺 updated_at / deleted_at → 补
- **P2-38** SetType.AMRAP 用法未定 → PRD 加说明
- **P2-39** Exercise.created_by 无 FK → 改关系
- **P2-40** 跨端时区处理不严 → §0 加规则

---

## 文档间冲突清单（15 处）

| # | 冲突点 | 文档 A | 文档 B | 链接 |
|---|---|---|---|---|
| 1 | 教练访问 PED：scope vs PIN | SCHEMA §10.2 §14.3 | API §16 | P0-4 |
| 2 | 受控物质支出走普通 expenses | SCHEMA §14 | SCHEMA §9.1 + API §13 | P0-8 |
| 3 | "字段级权限"措辞 | PRD §5.4 | SCHEMA §10.2 | P1-11 |
| 4 | 教练学员席位上限 30/25 | PRD §6.1 | SCHEMA §10.1 | P1-12 |
| 5 | 迁移目录命名时间 | SCHEMA §15 | TIMELINE W2 | P1-17 |
| 6 | 北极星完整记录无 source | PRD §7 | SCHEMA §11 | P1-28 |
| 7 | 计划餐 | PRD §3 + API §8 | SCHEMA 全文无 | P0-1 |
| 8 | last_values cache | UX §7 | SCHEMA 无 | P0-5 |
| 9 | client_op_id 通用约定多表违反 | SCHEMA §0 | SCHEMA §5/§6/§8/§10/§14 | P0-6 |
| 10 | session today 单 / 多 | API §5.1 | SCHEMA §4.5 | P1-22 |
| 11 | Refresh / Logout / PIN session 实体 | API §1 §16 | SCHEMA 全文无 | P0-7 |
| 12 | 备赛剩余周数存与不存 | UX §1.4 | SCHEMA §8.2 | P1-18 |
| 13 | 离线优先 vs 照片直传 | UX §1.7 | API §10.1 | P1-24 |
| 14 | Lighthouse PWA 95 过期 | TIMELINE §9 + W11 | 现实 | P2-31 |
| 15 | 教练改训练 vs 仅改 macros | PRD §3 | API §14 | P1-21 |

---

## 总结

设计**方向、行业洞察、UX 准则**都是行业头部水准，UX 准则文档可作为团队工位 poster。但 **SCHEMA + API 这两份"工程蓝图"对不齐 PRD/UX 承诺**——尤其是：

1. "今日计划餐"实体缺失（P0-1）
2. 教练-PED 访问路径自相矛盾（P0-4）
3. "默认值即历史值"没有缓存表（P0-5）
4. 多张子表违反自定的离线幂等通用字段约定（P0-6）
5. `CoachComment` 多态外键 + `WeeklyCheckIn.photos` 反向关系会直接让 Prisma 编译失败（P0-2, P0-3）

8 个 P0 必须先修复才能进入 W2 schema 落地阶段，否则后端工程师在 W2 第一天 `prisma generate` 就会被 P0-2 / P0-3 卡住，W6 一键打卡功能会被 P0-1 卡住，W10 PED 模块会被 P0-4 / P0-8 卡住。

**结论：不阻塞 W1 启动，但 W2 开工前 8 个 P0 必须全部 close，并把 P1-9 ~ P1-17 进入 W2 待办清单。**

---

**评审完成日期**: 2026-05-27  
**Reviewer**: subagent `ac3f904c`  
**Status**: ⚠️ Pass with mandatory fixes
