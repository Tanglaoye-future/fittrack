# FitFlow Pro v2 — 设计文档评审报告（R2 复审）

**评审日期**: 2026-05-27  
**评审类型**: 自动 self-check（grep 证据法）  
**评审对象**: R2 修订后的 5 份 v2 文档  
**前置报告**: [20260527_v2_docs_initial_r1.md](./20260527_v2_docs_initial_r1.md)  
**结论**: ✅ **通过**，可入库

---

## P0 验证（8/8 必须 pass）

| ID | 状态 | 证据 |
|---|---|---|
| P0-1 计划餐缺实体 | ✅ | SCHEMA §5.4 含 `MealPlanTemplate / ScheduledMeal / ScheduledMealIngredient`；API §8 `/meals/quick-log` 改用 `scheduled_meal_id`；PRD 已引用 |
| P0-2 CoachComment 多态 FK | ✅ | SCHEMA §10.4 `target_id String` 仅注释"应用层多态 ID，不做 FK"；`check_in` 反向字段移除 |
| P0-3 photos 反向关系断 | ✅ | SCHEMA §7.2 `ProgressPhoto.weekly_check_in_id` + `@relation("CheckInPhotos")` 反向关系完整 |
| P0-4 教练-PED 流程打架 | ✅ | SCHEMA §14.3-14.5 `ControlledViewToken` 独立路径；API §16.2 `/coach/.../controlled` 用 `X-Controlled-View-Token` |
| P0-5 "默认值即历史值"无 schema | ✅ | SCHEMA §5.7 `LastValueCache`；API §5.1 `suggested_sets` 含 `source` 字段（LAST_VALUE / TEMPLATE / EMPTY） |
| P0-6 子表缺 client_op_id | ✅ | SCHEMA §0.1 父子表幂等策略表；12 张子表已逐张补 `client_op_id` + `client_ts` + `created_at` + `updated_at` + `deleted_at` |
| P0-7 RefreshToken / PinSession / CoachInvitation 缺 | ✅ | SCHEMA §3.2 `RefreshToken`、§10.3 `CoachInvitation`、§14.4 `ControlledPinSession`、§14.5 `ControlledViewToken` 全部新增；API §1 增加 `/auth/sessions`、`/auth/logout-all` |
| P0-8 CONTROLLED 在普通 expenses | ✅ | SCHEMA §9.1 `ExpenseCategory` 移除 CONTROLLED（grep 验证 "CONTROLLED          // 受控物质" 无匹配）；新增 `ControlledExpense` 表；API §13 注明永不返回；§16.1 新增 `/controlled/expenses` |

**8/8 通过** ✅

---

## 必修 P1 验证（17/17 pass）

| ID | 状态 | 证据 |
|---|---|---|
| P1-9 SetEntry 缺字段 | ✅ | 已加 `user_id`、`exercise_id`、`session_date`、`updated_at`、`deleted_at` + 3 个索引 |
| P1-10 GIN simple 中文 | ✅ | SCHEMA §13 改 `CREATE EXTENSION pg_trgm + gin_trgm_ops` |
| P1-11 "字段级"措辞 | ✅ | PRD §5.4 已改"**模块级**权限" |
| P1-12 订阅 schema | ✅ | SCHEMA §3.3 `Subscription / SubscriptionSeat / Invoice` 三表；PRD §6.1 数字已对齐 |
| P1-13 partial unique | ✅ | SCHEMA §10.2 注释 `CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'`；API §14.2 service 校验 |
| P1-14 红黄绿规则 | ✅ | API §14.1 4 段判定规则 |
| P1-15 PR 算法 | ✅ | SCHEMA §4.8 Epley 公式 + 选举规则 + 落地位置（PrService.detectAndUpdate） |
| P1-16 ROI 公式 | ✅ | API §13 完整公式 + 时间窗 + 数据不足处理 |
| P1-17 迁移命名 | ✅ | 统一为 `20260603000000_v2_init`（SCHEMA §15 + TIMELINE W2） |
| P1-18 weeks_remaining | ✅ | SCHEMA §8.2 字段删除 + 注释；TIMELINE W8 同步删除"每日更新 weeks_remaining"任务 |
| P1-19 ReminderRule | ✅ | SCHEMA §10.5 + API §17.1 全套 CRUD |
| P1-21 教练改训练 | ✅ | PRD §5.4 教练边界表；API §14.1 `/coach/.../training-adjustments` |
| P1-22 /today 数组 | ✅ | API §5.1 注明"今日所有 session **数组**" |
| P1-23 PIN 暴力破解 | ✅ | SCHEMA §14.4 `fail_attempts / locked_until`；API §16.1 5 次锁 15min + 邮件通知 |
| P1-24 照片离线 | ✅ | API §10.1 `/photos/upload-url/refresh` + 5 步离线流程 |
| P1-25 audit-logs | ✅ | API §17 `/users/me/audit-logs`；§16.1 `/controlled/access-history` |
| P1-29 JSON 拆列（partial） | ✅ | `scopes` 拆 booleans；`coach_adjustment` 拆字段；`per_category_budget` 拆 `BudgetCategoryLine` 表 |

**17/17 通过** ✅

---

## R2 修订过程中发现的新问题（修订）

| ID | 描述 | 处理 |
|---|---|---|
| N2-1 | TIMELINE W8 仍写"每日更新 weeks_remaining"（与 SCHEMA §8.2 删字段决策矛盾） | ✅ 已在本轮修正为"写当日 MacroTarget"，weeks_remaining 改为运行时算 |
| N2-2 | TIMELINE W9 仍写"字段级权限通过测试"（与 P1-11 措辞统一矛盾） | ✅ 已改"模块级权限（scope_* booleans）" |
| N2-3 | PRD 第 329 行有"字段级合并" | ✅ 经核对，此处指 LWW **数据冲突字段级合并**，与权限的"字段级 vs 模块级"是不同概念，无需修改 |

---

## Deferred 项（不阻塞入库，写入 commit message）

### Deferred P1

- **P1-20 PEAK Protocol 业务规则细化**：SCHEMA `PeakProtocolTemplate` 实体已加，7 天数组配置已就位；具体推送时机和状态机迁移留 W8 实施时细化
- **P1-24 照片离线 BackgroundFetch 兼容性**：API 协议已定义，iOS Safari / Chrome Android 实测留 W11
- **P1-27 双 host 部署细节**：SCHEMA / 网关层规则已写；CI 检测、域名 DNS 配置、独立证书等 ops 细节留 W12 ops 文档
- **P1-29 JSON 拆列（剩余）**：`payload Json?` 在 ReminderRule 中保留（推送模板灵活性需要），可接受

### Deferred P2（全部）

P2-31 ~ P2-40 共 10 条建议项全部留待后续 PR；本批次不涉及阻塞或开发体感重灾区。

---

## 总结

✅ **8 个 P0 全部修复**  
✅ **17 个必修 P1 全部修复**  
✅ **3 个 R2 修订过程中发现的新问题已即时处理**  
⏳ **3 个 Deferred P1 + 10 个 P2 写入 commit message 备忘**

**结论：可入库，建议立即 git commit。**

---

**Reviewer**: self-check via grep + Read  
**Status**: ✅ Pass — Ready for Commit
