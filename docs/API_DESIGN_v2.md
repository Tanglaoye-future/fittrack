# FitFlow Pro v2 — API 设计文档

**文档版本**: 2.0  
**创建日期**: 2026-05-27  
**API 版本**: `v2`  
**Base URL**: `https://api.fitflow.pro/v2`  
**认证**: JWT Bearer Token（Access 30min / Refresh 30d）  
**响应**: JSON  
**时区**: 请求/响应 timestamp 全部 ISO 8601 UTC（`Z` 结尾）  
**替代文档**: 本文档完全替代 `API_DESIGN.md`（v1）

---

## 0. 总体约定

### 0.1 响应格式

成功：
```json
{
  "code": 0,
  "data": { ... },
  "meta": { ... }   // 可选：分页 / 时间戳 / 同步信息
}
```

错误：
```json
{
  "code": 4xx | 5xx,
  "message": "human readable",
  "error_code": "MEAL_FOOD_NOT_FOUND",
  "details": { ... }
}
```

### 0.2 通用请求头

```
Authorization: Bearer <jwt>
X-Client-Version: pwa-2.0.0
X-Client-Timezone: Asia/Shanghai
X-Client-Op-Id: <uuid>     # 写操作必填，离线幂等键
X-Idempotency-Key: <uuid>  # 等价于 X-Client-Op-Id
```

### 0.3 幂等与离线同步

**所有写操作（POST / PATCH / DELETE）必须携带 `X-Client-Op-Id`。**

- 服务端把 `client_op_id` 持久化到对应实体
- 同一 `client_op_id` 重复提交 → 返回首次的结果（200，不重复写入）
- 客户端断网时把请求放本地队列，重连后回放
- 冲突解决：字段级 Last-Write-Wins，关键字段（如 `stage_date`）需 user 确认

### 0.4 分页

`?page=1&limit=20`，最大 limit=100。响应 `meta`:
```json
{ "page": 1, "limit": 20, "total": 354, "has_next": true }
```

### 0.5 限流

| 范围 | 限制 |
|---|---|
| 默认 | 200 req/min/user |
| 认证端点（login/register） | 20 req/min/IP |
| 写操作（PED 相关） | 60 req/min/user + 单独审计 |
| 文件上传 | 30 req/min/user |

### 0.6 权限矩阵

| 角色 | 自有数据 | 名下学员数据 | 全局字典（Food/Exercise） |
|---|---|---|---|
| **athlete** | R/W | — | R + 提议新增（待审） |
| **coach** | R/W | R/W on scopes，写仅 coach_comment / coach_adjustment | R + 提议新增 |
| **both** | 取并集 | 取并集 | 同上 |
| **admin**（运营） | — | — | R/W |

教练访问学员数据时，服务端必检：
1. 存在 `CoachAthleteLink(coach=self, athlete=target, status=ACTIVE)`
2. 对应字段 scope 为 true
3. 写入 `audit_logs`

### 0.7 错误码命名

`{MODULE}_{REASON}`，如：`MEAL_FOOD_NOT_FOUND`、`COACH_NO_PERMISSION`、`CONTROLLED_MODULE_DISABLED`

---

## 1. Auth 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/register` | 注册（含 role：`athlete` / `coach` / `both`） |
| POST | `/auth/login` | 邮箱或手机号 + 密码 |
| POST | `/auth/refresh` | 刷新 access token（轮换：每次返回新 access + 新 refresh；旧 refresh 标记 revoked + 写 rotated_to） |
| POST | `/auth/logout` | 销毁当前 refresh token（写 `revoked_at`） |
| POST | `/auth/logout-all` | 销毁该用户所有 refresh token（一键下线所有设备） |
| GET | `/auth/sessions` | 列出当前 active refresh tokens（用户在哪些设备登录） |
| DELETE | `/auth/sessions/:id` | 撤销指定设备 |
| POST | `/auth/password/reset-request` | 发邮件 |
| POST | `/auth/password/reset-confirm` | 链接令牌确认（成功后自动撤销该用户所有 refresh token） |

> **Refresh token 撤销机制（修订 R2，评审 P0-7）**：
> - Refresh token 持久化到 `refresh_tokens` 表（SCHEMA §3.2），仅存 SHA-256 hash
> - 每次 `/auth/refresh` 验证 `revoked_at IS NULL AND expires_at > NOW()`
> - 修改密码 / `logout-all` 触发该用户所有 token revoke
> - Access token 30 min 过期、refresh token 30 天过期；轮换策略防 token 重放

**注册请求**:
```json
{
  "email": "athlete@x.com",
  "phone": null,
  "username": "ironmike",
  "password": "***",
  "role": "athlete",         // athlete / coach / both
  "gender": "MALE",
  "birth_date": "1995-06-12",
  "height_cm": 178,
  "initial_weight_kg": 92.4,
  "timezone": "Asia/Shanghai",
  "unit_system": "METRIC"
}
```

---

## 2. Users 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/users/me` | 自己档案 |
| PATCH | `/users/me` | 更新档案 |
| POST | `/users/me/role/toggle-coach` | 升级为 both（运动员 + 教练） |
| POST | `/users/me/avatar` | multipart 上传头像 |
| POST | `/users/me/controlled-module/enable` | 启用 PED 模块（带免责声明 ack） |
| POST | `/users/me/controlled-module/disable` | 关闭 |
| POST | `/users/me/controlled-module/pin` | 设/改 PIN |
| GET | `/users/me/preferences` | 偏好（默认值、提醒时段等） |
| PATCH | `/users/me/preferences` | 更新偏好 |
| GET | `/users/me/subscription` | 订阅信息 |

---

## 3. Exercises 模块（动作库，全局）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/exercises` | 列表，支持 `?q=&muscle=&equipment=` |
| GET | `/exercises/:id` | 详情 + 视频 |
| POST | `/exercises` | 用户自建（待审） |
| GET | `/exercises/popular` | 热门动作（按用户使用频次） |

**搜索响应**:
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name_zh": "杠铃卧推",
      "name_en": "Barbell Bench Press",
      "primary_muscle": "CHEST",
      "equipment": "BARBELL",
      "thumbnail_url": "..."
    }
  ]
}
```

---

## 4. Training Plans 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/training-plans` | 自己的所有计划 |
| GET | `/training-plans/active` | 当前激活的计划 |
| POST | `/training-plans` | 新建（可基于官方模板克隆） |
| GET | `/training-plans/:id` | 详情 + 包含 templates + exercises |
| PATCH | `/training-plans/:id` | 更新 |
| DELETE | `/training-plans/:id` | 软删 |
| POST | `/training-plans/:id/activate` | 切换激活计划 |
| GET | `/training-plans/templates` | 官方提供的预设计划库 |
| POST | `/training-plans/:id/clone` | 复制一份 |

**模板嵌套写法**（一次性建好全部）:
```http
POST /training-plans
{
  "name": "Prep W1-8 推拉腿",
  "weeks": 8,
  "templates": [
    {
      "name": "Day A - 胸+三头",
      "day_of_week": 1,
      "rest_seconds_default": 90,
      "exercises": [
        { "exercise_id": "uuid", "target_sets": 4, "target_reps_min": 6, "target_reps_max": 10, "target_rir": 1 },
        { "exercise_id": "uuid", "target_sets": 3, "target_reps_min": 8, "target_reps_max": 12, "target_rir": 2 }
      ]
    }
  ]
}
```

---

## 5. Workouts 模块（Loop A 主战场）

### 5.1 Session 级

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/workouts/sessions` | 列表 `?date=&date_from=&date_to=&plan_id=` |
| GET | `/workouts/sessions/today` | 今日所有 session **数组**（一日可有多次训练，修订 R2 评审 P1-22） |
| POST | `/workouts/sessions/start` | **开始训练**（基于 template 或自由训练） |
| GET | `/workouts/sessions/:id` | 详情（含所有 exercises + sets） |
| PATCH | `/workouts/sessions/:id` | 更新（如 overall_rpe / notes） |
| POST | `/workouts/sessions/:id/finish` | 结束（写 end_time + 汇总） |
| DELETE | `/workouts/sessions/:id` | 软删 |
| GET | `/workouts/sessions/:id/summary` | 汇总（总组数 / 总吨位 / 平均 RPE / PR） |

**开始训练**:
```http
POST /workouts/sessions/start
X-Client-Op-Id: <uuid>
{
  "template_id": "uuid",         // 可选；缺则自由训练
  "session_date": "2026-05-27",
  "bodyweight_kg": 82.4
}
```
**响应**包含预填的 exercises + 每个 exercise 的默认组：
```json
{
  "data": {
    "id": "session-uuid",
    "exercises": [
      {
        "id": "se-uuid",
        "exercise_id": "ex-uuid",
        "exercise_name": "杠铃卧推",
        "order_index": 0,
        "target_sets": 4,
        "rest_seconds": 90,
        "suggested_sets": [
          { "set_index": 1, "set_type": "WARMUP",  "weight_kg": 60,  "reps": 10, "source": "TEMPLATE" },
          { "set_index": 2, "set_type": "WARMUP",  "weight_kg": 80,  "reps": 6,  "source": "TEMPLATE" },
          { "set_index": 3, "set_type": "WORKING", "weight_kg": 100, "reps": 8, "rir": 1, "source": "LAST_VALUE" },
          { "set_index": 4, "set_type": "WORKING", "weight_kg": 100, "reps": 7, "rir": 1, "source": "LAST_VALUE" }
        ]
      }
    ]
  }
}
```

**`suggested_sets` 来源规则（修订 R2，评审 P0-5）**：

```
对每个 (exercise_id, set_index):
  1. 查 LastValueCache(user_id, domain='SET', key='{exercise_id}:{set_index}')
     → 命中 → source='LAST_VALUE'
  2. 未命中 → fallback 到 TemplateExercise 的 target_weight/reps/rir
     → source='TEMPLATE'
  3. 仍未命中（自由训练 + 无历史）→ source='EMPTY'，所有字段空
```

`LastValueCache` 由 `POST .../sets`（即一组写入后）的 service 维护（详见 SCHEMA §5.7）。

### 5.2 SessionExercise 级

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/workouts/sessions/:sid/exercises` | 加动作 |
| PATCH | `/workouts/sessions/:sid/exercises/:eid` | 调顺序 / 改备注 |
| DELETE | `/workouts/sessions/:sid/exercises/:eid` | 移除 |

### 5.3 Set 级（最高频）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/workouts/sessions/:sid/exercises/:eid/sets` | **完成一组**（高频） |
| PATCH | `/workouts/sets/:sid` | 改组数据 |
| DELETE | `/workouts/sets/:sid` | 删组 |
| POST | `/workouts/sets/batch` | 批量上传（离线队列回放） |

**完成一组**:
```http
POST /workouts/sessions/{sid}/exercises/{eid}/sets
X-Client-Op-Id: <uuid>
{
  "set_index": 3,
  "set_type": "WORKING",
  "weight_kg": 100,
  "reps": 8,
  "rir": 1,
  "rest_seconds": 88,
  "client_ts": "2026-05-27T10:32:18.123Z"
}
```

**离线批量上传**:
```http
POST /workouts/sets/batch
{
  "operations": [
    { "client_op_id": "uuid1", "session_exercise_id": "se", "data": {...} },
    { "client_op_id": "uuid2", ... }
  ]
}
```
响应逐条 success / conflict。

### 5.4 PR 与历史

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/workouts/exercises/:exercise_id/history` | 此动作过去 N 次的所有 set |
| GET | `/workouts/exercises/:exercise_id/prs` | PR 列表 |
| GET | `/workouts/prs/recent` | 近 30 天打破的 PR |

**PR 自动检测算法**（修订 R2，评审 P1-15）—— 详见 SCHEMA §4.8。  
触发位置：`POST /workouts/.../sets` 的 service 在写入 SetEntry 后同步调用 `PrService.detectAndUpdate(setEntry)`，可能写入 1–3 条 `PersonalRecord`。  
响应中若有 PR 刷新会在 `meta.prs_broken: [{ record_type, value, prev_value }]`。

---

## 6. Foods 模块（食材库）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/foods` | `?q=&category=&barcode=` 搜索 |
| GET | `/foods/recent` | 我最近用过的（提速饮食打卡） |
| GET | `/foods/favorites` | 我收藏的 |
| POST | `/foods/:id/favorite` | 加收藏 |
| DELETE | `/foods/:id/favorite` | 取消收藏 |
| GET | `/foods/:id` | 详情 |
| POST | `/foods` | 用户提议新增（待审） |
| POST | `/foods/scan-barcode` | 上传条码识别 |

---

## 7. Recipes 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/recipes` | 自己的所有配方 |
| POST | `/recipes` | 新建（嵌套 ingredients） |
| GET | `/recipes/:id` | 详情 + macros 反算 |
| PATCH | `/recipes/:id` | 更新 |
| DELETE | `/recipes/:id` | 软删 |
| POST | `/recipes/:id/clone` | 复制 |
| GET | `/recipes/:id/macros` | 单独取 macros（实时计算） |

---

## 8. Meals 模块（Loop B 主战场）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/meals` | `?date=` 当日所有餐 |
| GET | `/meals/today` | 今日 + 当日 target + 已达成 |
| GET | `/meals/planned/today` | 今日计划餐（来自 active MealPlanTemplate.scheduled_meals） |
| GET | `/meals/plan-templates` | 我的餐单模板 |
| POST | `/meals/plan-templates` | 新建/克隆餐单模板（嵌套 scheduled_meals） |
| PATCH | `/meals/plan-templates/:id` | 更新 |
| POST | `/meals/plan-templates/:id/activate` | 切换激活模板 |
| POST | `/meals` | **一餐打卡**（带 items） |
| GET | `/meals/:id` | 详情 |
| PATCH | `/meals/:id` | 更新 |
| DELETE | `/meals/:id` | 软删 |
| POST | `/meals/:id/items` | 加食材项 |
| PATCH | `/meals/items/:id` | 改克数 |
| DELETE | `/meals/items/:id` | 删除项 |
| POST | `/meals/quick-log` | **一键打卡**（按计划餐直接确认完成） |

**一键打卡（最快路径）** —— 修订 R2 评审 P0-1：参数改 `scheduled_meal_id`，对应 SCHEMA §5.4 新增的 `ScheduledMeal`：
```http
POST /meals/quick-log
X-Client-Op-Id: <uuid>
{
  "scheduled_meal_id": "sm-uuid",   // 来自 /meals/planned/today
  "consumed_at": "2026-05-27T07:32:00Z"
}
```

服务端在事务内 fan-out：
1. 读取 `ScheduledMeal` + 其 `recipe` 或 `ingredients`
2. 创建 `MealLog`（`is_planned=true`，`meal_slot` 复制）
3. 创建对应 `MealItem`，snapshot macros 全部填充
4. 父级 client_op_id 幂等保护（重复提交返回首次结果）

**自由餐打卡**:
```http
POST /meals
X-Client-Op-Id: <uuid>
{
  "meal_slot": "LUNCH",
  "consumed_at": "2026-05-27T12:30:00Z",
  "items": [
    { "food_id": "uuid-chicken-breast", "grams": 220 },
    { "food_id": "uuid-sweet-potato",   "grams": 250 },
    { "recipe_id": "uuid-sauce" }
  ]
}
```
响应包含自动反算的 `total_kcal/protein/carbs/fat`。

### 8.1 水分 / 电解质

| 方法 | 路径 |
|---|---|
| POST | `/nutrition/water` |
| GET | `/nutrition/water?date=` |
| POST | `/nutrition/electrolytes` |
| GET | `/nutrition/electrolytes?date=` |

---

## 9. Supplements 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/supplements/schedules` | 我的套餐 |
| POST | `/supplements/schedules` | 新建套餐（含 items） |
| PATCH | `/supplements/schedules/:id` | 更新 |
| DELETE | `/supplements/schedules/:id` | 软删 |
| POST | `/supplements/schedules/:id/log-all` | **一键套餐打卡** |
| POST | `/supplements/logs` | 单条打卡 |
| GET | `/supplements/logs?date=` | 当日 |

---

## 10. Body Records 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/body-records` | `?date_from=&date_to=` |
| GET | `/body-records/today` | 今日（如有） |
| POST | `/body-records` | 新增 / Upsert by date |
| GET | `/body-records/:id` | 详情含 photos |
| PATCH | `/body-records/:id` | 更新 |
| DELETE | `/body-records/:id` | 软删 |
| GET | `/body-records/trends` | `?metric=weight&period=30d` 趋势 |

### 10.1 Progress Photos（含离线方案，修订 R2 评审 P1-24）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/photos/upload-url` | 申请预签名 URL（PUT 直传到对象存储；有效 24h） |
| POST | `/photos/upload-url/refresh` | 离线超时后续签 |
| POST | `/photos` | 上传完成后写元数据 |
| GET | `/photos` | `?date_from=&angle=&pose=` |
| GET | `/photos/:id` | 含可见性信息 |
| PATCH | `/photos/:id` | 改 visibility / pose |
| DELETE | `/photos/:id` | 软删 |
| POST | `/photos/compare` | `{ left_id, right_id }` 对比页 |

**照片离线上传策略**：
1. 离线状态：前端把原图 + 缩略图（≤ 256 KB）存 IndexedDB（`photo_queue` store），同时把元数据用 `client_op_id` 写到 `meta_queue`
2. 联网时：先 `POST /photos/upload-url` 取预签名 → PUT 原图 → `POST /photos` 写元数据（携带 client_op_id 幂等）
3. 上传冲突（presigned URL 过期）→ 调 `/photos/upload-url/refresh` 重新申请
4. 重试策略：指数退避，最多 5 次；超过后保留本地副本并提示用户
5. PWA Service Worker 注册 BackgroundSync，应用关闭时仍会重试

---

## 11. Competitions 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/competitions` | 我的所有比赛 |
| POST | `/competitions` | 新增（自动创建 PrepCycle） |
| GET | `/competitions/:id` | 详情 + cycle + phases |
| PATCH | `/competitions/:id` | 更新 |
| DELETE | `/competitions/:id` | 软删 |
| GET | `/competitions/active/countdown` | 当前激活比赛倒数 + 阶段 |
| GET | `/prep-cycles/:id` | 详情 |
| PATCH | `/prep-cycles/:id` | 更新（切阶段、改 macros） |
| POST | `/prep-cycles/:id/phases` | 添加 phase |
| PATCH | `/prep-cycles/phases/:id` | 改 phase 配置 |
| POST | `/prep-cycles/:id/auto-generate-phases` | **自动生成 16 周递减 macros** |
| GET | `/prep-cycles/:id/today-targets` | 今日 macros / cardio 目标 |

---

## 12. Check-Ins 模块（Loop C 主战场）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/check-ins` | 自己历史 |
| GET | `/check-ins/draft` | **本周预填草稿**（系统自动聚合过去 7 天） |
| POST | `/check-ins` | 提交本周 check-in |
| GET | `/check-ins/:id` | 详情 + 教练评注 |
| PATCH | `/check-ins/:id` | 提交前修改 |
| POST | `/check-ins/:id/acknowledge` | 运动员确认收到教练反馈 |

**预填响应**:
```json
{
  "data": {
    "week_index": 8,
    "check_in_date": "2026-05-31",
    "avg_morning_weight": 82.4,
    "weight_change_kg": -0.3,
    "avg_kcal_actual": 3180,
    "avg_steps": 12400,
    "trainings_completed": 6,
    "cardio_minutes_total": 120,
    "needs_user_input": ["subjective_condition", "photos", "athlete_notes"]
  }
}
```

---

## 13. Expenses 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/expenses` | `?category=&date_from=&date_to=`（**永不**返回 ControlledExpense） |
| POST | `/expenses` | 新增（`category` 必须在 `ExpenseCategory` 枚举内，无 CONTROLLED） |
| GET | `/expenses/:id` | 详情 |
| PATCH | `/expenses/:id` | 更新 |
| DELETE | `/expenses/:id` | 软删 |
| GET | `/expenses/stats` | 按类汇总（含同比，**排除** ControlledExpense） |
| GET | `/expenses/roi` | **ROI 报表**（见下方公式） |

> **关键合规约束（修订 R2 评审 P0-8）**：本模块**永不**返回 `ControlledExpense`。受控物质支出由 `/controlled/expenses`（§16）提供，必须 PIN session。`/system/export/full` 同样不含 controlled。

**ROI 报表公式定义（修订 R2 评审 P1-16）**：

```
查询参数：?period=90d|180d|365d|all  默认 180d

分子（支出）：在 period 内
  total_supplement_cost = Σ Expense.amount WHERE category = SUPPLEMENT
  total_food_cost       = Σ Expense.amount WHERE category IN (FOOD_GROCERY, DINING_OUT)
  total_all             = Σ Expense.amount WHERE category != COMPETITION_FEE/TRAVEL_COMPETITION
  注：ControlledExpense **不**纳入 ROI（合规 + 主观）

分母（增益）：在 period 内
  weight_change_kg      = BodyRecord(latest).morning_weight_kg - BodyRecord(earliest).morning_weight_kg
  bf_change_pct         = ...body_fat_percentage 同理
  lean_mass_gain_kg     = (latest_weight × (1 - latest_bf)) - (earliest_weight × (1 - earliest_bf))
                          ⚠️ 当样本不足 2 条 / 时间窗 < 30 天 → 返回 null

输出：
  cost_per_kg_lean      = total_supplement_cost / lean_mass_gain_kg   (lean_mass_gain_kg > 0 时)
  cost_per_kg_lean_all  = total_all / lean_mass_gain_kg
  signal_quality        = "high" | "medium" | "low"（基于样本密度）

当分母 ≤ 0（减脂期或样本不足）时返回：
  { lean_mass_gain_kg: null, message: "数据不足或处于减脂期，不计算 ROI" }
```

### 13.1 预算 & 循环

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/budgets/months/:year/:month` | 该月预算 + 实际 |
| PUT | `/budgets/months/:year/:month` | 设/改预算 |
| GET | `/recurring-expenses` | 我的循环账单 |
| POST | `/recurring-expenses` | 新增 |
| PATCH | `/recurring-expenses/:id` | 改 |
| DELETE | `/recurring-expenses/:id` | 删 |

---

## 14. Coach 模块

### 14.1 教练端

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/coach/dashboard` | 学员看板（所有学员的"红黄绿"状态，规则见下方） |
| GET | `/coach/athletes` | 我的学员列表 |
| GET | `/coach/athletes/:athlete_id` | 学员详情（按 scope booleans 过滤，见 SCHEMA §10.2） |
| GET | `/coach/athletes/:athlete_id/check-ins` | 该学员 check-ins |
| GET | `/coach/athletes/:athlete_id/sessions?date=` | 该学员训练 |
| GET | `/coach/athletes/:athlete_id/meals?date=` | 该学员饮食 |
| POST | `/coach/athletes/:athlete_id/adjustments` | **下发宏量调整方案**（写入 MacroTarget；不改训练，参见 §14.3） |
| POST | `/coach/athletes/:athlete_id/training-adjustments` | **下发训练调整**（修订 R2 评审 P1-21：覆盖未来某周的 TemplateExercise.target_*） |
| POST | `/coach/check-ins/:id/respond` | 回复学员 check-in |
| POST | `/coach/comments` | 通用评论（target_type + target_id） |
| POST | `/coach/invitations` | 邀请学员（生成 invite_code，落地到 SCHEMA §10.3） |
| POST | `/coach/invitations/:id/cancel` | 撤销邀请 |
| POST | `/coach/athletes/:athlete_id/controlled/view-request` | 向运动员申请受控视图 token（运动员需在 App 内确认） |
| GET | `/coach/athletes/:athlete_id/controlled` | **受控物质只读视图**（需 X-Controlled-View-Token，详见 §16.2） |

**学员看板"红黄绿"判定规则（修订 R2 评审 P1-14）**：

```
对每个 ACTIVE 学员，取过去 7 天数据，按下列优先级判定（首匹配即定）：

🔴 红（critical，须立即关注）：
  - 连续 ≥ 3 天 0 条 meal_logs 且 0 条 workout_sessions（疑似失联）
  - 最近 1 次 check-in 距今 > 14 天（错过 check-in）
  - 体重 7 日均值偏离 PhaseConfig.target_weight_trend ≥ 1.5 kg
  - 训练完成率 < 50%（按 PrepCycle 当周计划）

🟡 黄（warning，本周需调整）：
  - 任一天 kcal 摄入与 target 偏差 > 15% 且 出现 ≥ 2 天
  - 训练完成率 50–80%
  - subjective_condition 最近一次评分 ≤ 4
  - water_retention_score 最近一次 ≥ 4

🟢 绿（on track）：
  - 不命中以上任何条件
```

规则常量存放于 `coach_dashboard_thresholds`（配置表，admin 可调；MVP 写死代码）。

### 14.2 运动员端（关于教练）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/coach-links/me` | 我连接的教练 |
| POST | `/coach-links/accept` | 接受教练邀请（带 invite_code）。**校验**：subscription.tier 必须 ATHLETE_PRO 或更高；同时不能有其他 ACTIVE link（partial unique 强制） |
| PATCH | `/coach-links/:id/scopes` | 调整教练能看的模块（scope_* booleans） |
| POST | `/coach-links/:id/pause` | 暂停（教练读不到新数据） |
| POST | `/coach-links/:id/end` | 终止合作（同时撤销所有 ControlledViewToken） |
| POST | `/coach-links/:id/controlled/grant` | 向该教练签发 ControlledViewToken（运动员主动）。body：`{ scope: 'SUMMARY'|'FULL', expires_in_days: 7 }` |
| DELETE | `/coach-links/:id/controlled/grant` | 撤销已签发的 ControlledViewToken |

**下发调整方案**:
```http
POST /coach/athletes/{athlete_id}/adjustments
{
  "effective_from": "2026-06-02",
  "macros": { "kcal": 3100, "protein_g": 250, "carbs_g": 320, "fat_g": 80 },
  "cardio": { "sessions_per_week": 5, "minutes_per_session": 30, "type": "LISS" },
  "daily_steps": 12000,
  "note": "本周减 100 kcal，加 10 min 有氧"
}
```

---

## 15. Analytics 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/analytics/dashboard/today` | 主页今日卡片（4 个核心指标） |
| GET | `/analytics/daily-summary?date=` | 单日全维度 |
| GET | `/analytics/weekly-summary?week_start=` | 单周 |
| GET | `/analytics/macros-adherence?period=30d` | Macro 达成率 |
| GET | `/analytics/strength-curve?exercise_id=&period=12w` | 力量曲线 |
| GET | `/analytics/weight-trend?period=90d` | 称重曲线（晨重） |
| GET | `/analytics/photos-timeline?week_step=2` | 照片时间线（每 2 周一组） |
| GET | `/analytics/prep-comparison?cycle_id=` | 备赛周期同期对比（与上一周期同周） |
| GET | `/analytics/spending-trend?period=12m` | 消费趋势 |

---

## 16. Controlled Module（PED，私域 — 修订 R2 后）

### 16.1 本人访问（PIN 路径）

> **所有 endpoint 要求**：
> 1. `users.controlled_module_enabled == true`
> 2. 请求头 `X-Controlled-PIN-Session: <token>`（POST /controlled/pin/verify 后 5 分钟有效）
> 3. 每次调用写 `audit_logs`
> 4. 商店分发版本（host = `app.fitflow.pro`）：网关层 403；构建产物 tree-shake 移除

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/controlled/pin/verify` | 验证 PIN 拿 session token；**含暴力破解防御**（详见下方） |
| POST | `/controlled/pin/change` | 改 PIN（需旧 PIN） |
| GET | `/controlled/cycles` | 我的周期 |
| POST | `/controlled/cycles` | 新建周期（含 protocol_items） |
| GET | `/controlled/cycles/:id` | 详情 |
| PATCH | `/controlled/cycles/:id` | 更新 |
| DELETE | `/controlled/cycles/:id` | 软删 |
| POST | `/controlled/doses` | 打卡注射/口服 |
| GET | `/controlled/doses?date_from=` | 历史 |
| POST | `/controlled/bloodwork` | 录入血检 |
| GET | `/controlled/bloodwork` | 历史 |
| GET | `/controlled/bloodwork/trends?marker=hematocrit` | 单指标趋势 |
| GET | `/controlled/expenses` | **受控消费**（SCHEMA §9.1 ControlledExpense） |
| POST | `/controlled/expenses` | 新增 |
| POST | `/controlled/export/request` | 请求加密导出（发邮件二次确认 + 独立 ZIP 密码） |
| GET | `/controlled/access-history` | 谁（含教练）访问过我的受控数据（来自 audit_logs） |

**PIN 暴力破解防御（修订 R2 评审 P1-23）**：
- PIN 必须 ≥ 6 位数字（注册/改 PIN 时校验）
- 5 次错误 → `controlled_pin_sessions.locked_until = now() + 15 min`
- 锁定期间所有 /controlled/* 路由 403 + `error_code: CONTROLLED_PIN_LOCKED`
- 锁定时发邮件通知用户（即使没开 push）
- 写 `audit_logs(action='CONTROLLED_PIN_LOCKED')`

### 16.2 教练访问（ControlledViewToken 路径）

> 修订 R2 评审 P0-4：教练**不**走 PIN，走运动员主动签发的 ControlledViewToken。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/coach/athletes/:athlete_id/controlled` | 受控只读视图。需请求头 `X-Controlled-View-Token: <token>`；token 必须未过期、未撤销、scope 匹配 |
| GET | `/coach/athletes/:athlete_id/controlled/cycles` | 周期 |
| GET | `/coach/athletes/:athlete_id/controlled/doses` | 剂量记录 |
| GET | `/coach/athletes/:athlete_id/controlled/bloodwork` | 血检 |

**教练访问时的脱敏规则**：
- 默认 `scope = SUMMARY`：返回字段集 = `{ compound, weekly_dose_mg, week_index, phase }`；**移除** `injection_site` / `taken_at` 精确时分 / `raw_report_url`
- 仅当 `scope = FULL` 且运动员二次确认才返回完整数据
- 每次访问写 `audit_logs(action='CONTROLLED_VIEWED_BY_COACH')` + 实时推送通知运动员

---

## 17. System 模块

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/system/health` | 健康检查 |
| GET | `/system/version` | 后端版本 + 最低支持的客户端版本 |
| POST | `/system/push/subscribe` | 注册 PWA Push |
| DELETE | `/system/push/:endpoint_id` | 退订 |
| POST | `/system/sync/replay` | 客户端重放离线队列（聚合接口） |
| GET | `/system/export/full` | 全量数据导出（异步，邮件发链接）— **不**含 ControlledExpense / ControlledCycle / 等受控数据 |
| GET | `/users/me/audit-logs` | **我的审计日志**（修订 R2 评审 P1-25）。`?action=&date_from=` |

### 17.1 Reminders 模块（修订 R2 评审 P1-19）

对应 SCHEMA §10.5 的 `ReminderRule`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/reminders` | 列出我的提醒规则 |
| POST | `/reminders` | 新建 |
| PATCH | `/reminders/:id` | 改 |
| DELETE | `/reminders/:id` | 删 |
| POST | `/reminders/seed-defaults` | 一键启用 UX §1.5 推荐的 7 条默认规则 |

---

## 18. WebSocket / SSE 实时（可选 v2.1）

为了"教练即时回复"与"训练中倒计时同步多端"，提供：

```
wss://api.fitflow.pro/v2/ws
事件：
  - coach.comment.created
  - check_in.response.created
  - workout.session.timer.tick   // 训练中休息计时多端同步
```

v2 MVP 用 30s 轮询替代，v2.1 升级 WS。

---

## 19. 字段命名规范

- 后端 DB：`snake_case`（如 schema 所示）
- API 请求/响应 JSON：`snake_case`（与 DB 一致，避免转换损耗）
- 前端 TS：到 service 层再转 `camelCase`
- 日期：DB 用 `DATE`，API 用 `"2026-05-27"`（YYYY-MM-DD）
- 时间戳：API 用 ISO 8601 UTC `"2026-05-27T08:30:00Z"`

---

## 20. 错误码索引（部分）

| Code | Error | 说明 |
|---|---|---|
| 400 | `MEAL_FOOD_NOT_FOUND` | 引用的 food_id 不存在 |
| 400 | `MEAL_ITEM_FOOD_RECIPE_XOR` | food_id / recipe_id 必须且仅一个 |
| 400 | `SET_INVALID_TYPE` | set_type 不在枚举中 |
| 400 | `SET_INVALID_TEMPO` | tempo 不符 ^\d-\d-\d-\d$ |
| 401 | `AUTH_TOKEN_EXPIRED` | access token 过期 |
| 401 | `AUTH_REFRESH_REVOKED` | refresh token 已被撤销 |
| 403 | `COACH_NO_PERMISSION` | 教练对该学员该模块 scope=false |
| 403 | `COACH_LINK_NOT_ACTIVE` | 教练-学员链接非 ACTIVE |
| 403 | `CONTROLLED_MODULE_DISABLED` | PED 模块未开启 |
| 403 | `CONTROLLED_PIN_REQUIRED` | 缺 PIN session |
| 403 | `CONTROLLED_PIN_LOCKED` | PIN 5 次错误锁 15 分钟 |
| 403 | `CONTROLLED_VIEW_TOKEN_REQUIRED` | 教练访问受控数据缺 view token |
| 403 | `CONTROLLED_VIEW_TOKEN_EXPIRED` | view token 已过期或被撤销 |
| 403 | `SUBSCRIPTION_TIER_INSUFFICIENT` | 当前订阅档不允许该操作（如 FREE 接受教练邀请） |
| 403 | `ATHLETE_ALREADY_HAS_ACTIVE_COACH` | Athlete Pro 只能同时关联 1 名教练 |
| 404 | `RESOURCE_NOT_FOUND` | 通用 |
| 409 | `SYNC_CONFLICT` | 字段冲突需人工解决 |
| 409 | `IDEMPOTENT_REPLAY` | client_op_id 已存在，返回首次结果 |
| 422 | `MACRO_TARGET_OVERLAP` | 同日已有目标 |
| 429 | `RATE_LIMITED` | 限流触发 |
| 500 | `INTERNAL` | 服务器错误 |

---

## 21. 部署与版本

- v2 与 v1 路由完全隔离：`/v2/*`（v1 `/v1/*` 在 v2 上线后保留 90 天回滚窗口）
- 客户端在 `X-Client-Version` 中声明版本，后端可强制升级
- 数据库：v2 独立 schema（`fitflow_pro_v2_db`），与 v1 并存
- 灰度：先放给 5 名种子选手，无问题后开放注册

---

**Last Updated**: 2026-05-27（R2 修订后）  
**Status**: ✅ Ready for Review（R2，含评审 P0 全部修复 + 必修 P1 修复）

---

## 22. R2 修订总览（评审驱动）

对应 `docs/reviews/20260527_v2_docs_initial_r1.md` 中 API 侧的修改：

| 评审 ID | API 文档修订位置 |
|---|---|
| P0-1 | §8 `/meals/quick-log` 改用 `scheduled_meal_id`；新增 `/meals/plan-templates` 系列 |
| P0-4 | §16.2 教练访问 PED 改走 ControlledViewToken 路径 |
| P0-5 | §5.1 `suggested_sets` 来源规则（LastValueCache → Template → Empty） |
| P0-7 | §1 RefreshToken 撤销机制 + `/auth/sessions`、`/auth/logout-all` |
| P0-8 | §13 `/expenses` 强制不返回 ControlledExpense；§16.1 新增 `/controlled/expenses` |
| P1-14 | §14.1 学员看板红黄绿判定规则 |
| P1-15 | §5.4 PR 算法说明（指向 SCHEMA §4.8） |
| P1-16 | §13 ROI 公式定义 |
| P1-19 | §17.1 Reminders 模块 CRUD |
| P1-21 | §14.1 `/coach/.../training-adjustments` |
| P1-22 | §5.1 `/today` 返回数组 |
| P1-23 | §16.1 PIN 暴力破解防御 |
| P1-24 | §10.1 照片离线策略 + presigned URL 续签 |
| P1-25 | §17 `/users/me/audit-logs` |

错误码同步扩充见 §20。
