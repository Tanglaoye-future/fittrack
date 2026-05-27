# FitFlow Pro v2 — 数据库设计文档

**文档版本**: 2.0  
**创建日期**: 2026-05-27  
**数据库**: PostgreSQL 16 + Prisma 5  
**时区**: 所有 TIMESTAMP 存 UTC；用户偏好时区存 `users.timezone`  
**替代文档**: 本文档完全替代 `DATABASE_SCHEMA.md`（v1），v1 仅作历史归档

---

## 0. 设计原则

1. **离线优先**：所有"用户写入型"表都含 `client_op_id`（UUID, UNIQUE）+ `client_ts`，幂等同步
2. **软删除**：所有用户数据表含 `deleted_at`
3. **审计**：所有表含 `created_at` + `updated_at`
4. **多租户**：所有用户数据表含 `user_id`，按 user_id 分区索引
5. **可扩展枚举用 VARCHAR + CHECK 约束**（避免 Postgres enum 加值需重建）
6. **金额用 DECIMAL(12,2)**，所有重量/克数 DECIMAL(8,2)
7. **数据可见性**：PED 相关字段用独立表，权限单独控制（§14）
8. **跨端时区**：用户提交日期字段（`*_date`）由服务端按 `users.timezone` 二次回算，原始客户端时区写入 `client_tz` 审计字段（关键表如 MealLog / WorkoutSession 必须）

### 0.1 父子表的离线幂等例外（适用于 §5/§6/§8 等聚合表）

对于由父表 fan-out 写入的子表（如 `MealItem` 由 `MealLog` 创建时一次性写入、`RecipeIngredient` 由 `Recipe` 创建时一次性写入、`SetEntry` 由 `WorkoutSession` 嵌套创建时），**子表本身不强制 `client_op_id`**，由父表统一负责幂等；服务端做 cascade upsert。

例外：**当子表本身存在独立的 POST/PATCH 端点**（如 `POST /workouts/sessions/:sid/exercises/:eid/sets` 单组追加、`POST /meals/:id/items` 单项追加），则子表**必须**自带 `client_op_id` + `client_ts`，本规范在对应表中显式声明。

下表标记每个子表的策略：

| 表 | 独立写端点 | client_op_id |
|---|---|---|
| `RecipeIngredient` | 无（仅嵌套创建） | ❌ 由 Recipe 负责 |
| `MealItem` | 有（PATCH/DELETE 单项） | ✅ 必须 |
| `TemplateExercise` | 有 | ✅ 必须 |
| `SessionExercise` | 有 | ✅ 必须 |
| `SetEntry` | 有（高频追加） | ✅ 必须 |
| `SupplementItem` | 无 | ❌ 由 SupplementSchedule 负责 |
| `PhaseConfig` | 有 | ✅ 必须 |
| `ControlledProtocolItem` | 无 | ❌ 由 ControlledCycle 负责 |

---

## 1. ER 全景图

```
                    ┌────────────────────┐
                    │       User         │  ← 角色：athlete / coach / both
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   [训练域]              [营养域]              [体测/备赛/消费/教练]
        │                     │                     │
   TrainingPlan          Food (全局)          BodyRecord
   └ TrainingTemplate    Recipe ──── RecipeIngredient
     └ TemplateExercise  MealLog ──── MealItem ──── Food
                         WaterLog               
   WorkoutSession        ElectrolyteLog        ProgressPhoto
   └ SessionExercise     SupplementSchedule
     └ SetEntry          └ SupplementItem
                         SupplementLog          CompetitionGoal
   Exercise (全局)       ControlledCycle (PED, §14)  └ PrepCycle
                                                       └ PhaseConfig
                                                       └ WeeklyCheckIn
                                                            └ CoachComment

                         Expense                 CoachAthleteLink
                         BudgetMonth             CoachProfile
                         RecurringExpense        
```

---

## 2. 通用字段约定

所有"用户写入型"实体共享下列字段（不每张表重复写）：

```prisma
id            String   @id @default(uuid())
user_id       String                          // 数据所属用户
client_op_id  String   @unique                // PWA 离线幂等键（必须）
client_ts     DateTime                        // 客户端写入时刻
created_at    DateTime @default(now())
updated_at    DateTime @updatedAt
deleted_at    DateTime?
```

**全局字典表**（Exercise / Food 等）不包含 user_id / client_op_id。

---

## 3. 账户域

### 3.1 users

```prisma
model User {
  id                String      @id @default(uuid())
  email             String      @unique
  phone             String?     @unique
  password_hash     String
  username          String      @unique
  avatar_url        String?
  
  // 个人档案
  gender            Gender?
  birth_date        DateTime?   @db.Date            // 取代 age（age 算出来）
  height_cm         Decimal?    @db.Decimal(5, 2)
  initial_weight_kg Decimal?    @db.Decimal(6, 2)
  
  // 偏好
  timezone          String      @default("Asia/Shanghai")
  unit_system       UnitSystem  @default(METRIC)    // METRIC / IMPERIAL
  language          String      @default("zh-CN")
  
  // 角色（一个账号可同时是运动员+教练）
  is_athlete        Boolean     @default(true)
  is_coach          Boolean     @default(false)
  
  // 订阅
  subscription_tier SubscriptionTier @default(FREE) // FREE / ATHLETE_PRO / COACH
  subscription_expires_at DateTime?
  
  // PED 模块独立开关（默认关闭，§14）
  controlled_module_enabled Boolean @default(false)
  controlled_module_pin_hash String?
  
  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt
  deleted_at        DateTime?
  
  // 反向关联
  training_plans    TrainingPlan[]
  workout_sessions  WorkoutSession[]
  meal_logs         MealLog[]
  body_records      BodyRecord[]
  competitions      CompetitionGoal[]
  expenses          Expense[]
  refresh_tokens    RefreshToken[]
  reminder_rules    ReminderRule[]
  subscription      Subscription?
  // ……
  
  coach_links_as_coach   CoachAthleteLink[] @relation("coach")
  coach_links_as_athlete CoachAthleteLink[] @relation("athlete")
  
  @@map("users")
}

enum Gender         { MALE FEMALE OTHER }
enum UnitSystem     { METRIC IMPERIAL }
enum SubscriptionTier { FREE ATHLETE_PRO COACH }
```

### 3.2 refresh_tokens（持久化 → 支持 logout / 撤销 / 轮换）

```prisma
model RefreshToken {
  id              String   @id @default(uuid())
  user_id         String
  token_hash      String   @unique             // SHA-256；明文不入库
  device_label    String?                      // "Pixel 7" / "iPhone 15"
  user_agent      String?
  ip              String?
  expires_at      DateTime
  revoked_at      DateTime?                    // 主动 logout 时置位
  rotated_to      String?                      // 轮换链；旧 token 指向新 token id
  created_at      DateTime @default(now())
  last_used_at    DateTime?
  
  user            User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id, revoked_at])
  @@map("refresh_tokens")
}
```

> 修订（R2）：原 API §1 提到 `/auth/refresh` 与 `/auth/logout` 但 schema 无对应表（评审 P0-7）。本表显式持久化 refresh token，使吊销可实现。

### 3.3 订阅 / 席位 / 发票

```prisma
model Subscription {
  user_id              String   @id            // 与 User 1:1
  tier                 SubscriptionTier
  status               SubscriptionStatus @default(ACTIVE)
  cycle                BillingCycle      @default(MONTHLY)
  current_period_start DateTime
  current_period_end   DateTime
  cancel_at_period_end Boolean @default(false)
  
  // 教练档专属
  athlete_capacity     Int?                    // 教练档基础 30
  
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  user                 User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
  seats                SubscriptionSeat[]
  invoices             Invoice[]
  
  @@map("subscriptions")
}

enum SubscriptionStatus { ACTIVE PAST_DUE CANCELLED EXPIRED }
enum BillingCycle       { MONTHLY YEARLY }

model SubscriptionSeat {
  id              String   @id @default(uuid())
  subscription_id String                       // 教练的 subscription.user_id
  athlete_user_id String
  link_id         String                       // CoachAthleteLink.id
  assigned_at     DateTime @default(now())
  released_at     DateTime?
  
  subscription    Subscription @relation(fields: [subscription_id], references: [user_id], onDelete: Cascade)
  
  @@unique([subscription_id, athlete_user_id])
  @@map("subscription_seats")
}

model Invoice {
  id              String   @id @default(uuid())
  subscription_id String
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("CNY")
  period_start    DateTime
  period_end      DateTime
  status          InvoiceStatus @default(OPEN)
  paid_at         DateTime?
  external_ref    String?                      // 支付平台单号
  
  created_at      DateTime @default(now())
  
  subscription    Subscription @relation(fields: [subscription_id], references: [user_id], onDelete: Cascade)
  
  @@index([subscription_id, period_start])
  @@map("invoices")
}

enum InvoiceStatus { OPEN PAID VOID FAILED }
```

> 修订（R2）：原文档商业模式有教练席位 + 月付/年付，但无 schema 支撑（评审 P1-12）。本节补齐订阅生命周期所需的 3 张表，与 PRD §6.1 数字（30 席位）对齐。即使 v2 MVP 不接支付，schema 已就绪。

---

## 4. 训练域（Loop A 核心）

### 4.1 exercises（全局动作库）

```prisma
model Exercise {
  id                String   @id @default(uuid())
  name_zh           String
  name_en           String
  description       String?
  primary_muscle    MuscleGroup
  secondary_muscles MuscleGroup[]
  equipment         Equipment                       // BARBELL / DUMBBELL / MACHINE / CABLE / BODYWEIGHT
  movement_pattern  MovementPattern                 // PUSH / PULL / SQUAT / HINGE / CARRY / ROTATION / ISOLATION
  video_url         String?                          // YouTube / Bilibili 示范
  thumbnail_url     String?
  is_official       Boolean  @default(true)         // 官方库 / 用户自建
  created_by        String?                         // user_id（用户自建时）
  created_at        DateTime @default(now())
  
  @@unique([name_en])
  @@map("exercises")
}

enum MuscleGroup {
  CHEST BACK_LATS BACK_TRAPS SHOULDERS_FRONT SHOULDERS_SIDE SHOULDERS_REAR
  BICEPS TRICEPS FOREARMS CORE_ABS CORE_OBLIQUES
  GLUTES QUADS HAMSTRINGS CALVES NECK
}

enum Equipment       { BARBELL DUMBBELL MACHINE CABLE BODYWEIGHT KETTLEBELL BAND OTHER }
enum MovementPattern { PUSH PULL SQUAT HINGE CARRY ROTATION ISOLATION }
```

### 4.2 training_plans（训练计划，例：8 周推拉腿）

```prisma
model TrainingPlan {
  id            String   @id @default(uuid())
  user_id       String
  name          String                                // "Prep Week 1-8 推拉腿"
  description   String?
  weeks         Int                                   // 周期长度
  is_active     Boolean  @default(false)              // 当前是否激活
  start_date    DateTime? @db.Date
  end_date      DateTime? @db.Date
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
  
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  templates     TrainingTemplate[]
  
  @@index([user_id])
  @@map("training_plans")
}
```

### 4.3 training_templates（计划内的"周一模板"）

```prisma
model TrainingTemplate {
  id            String   @id @default(uuid())
  plan_id       String
  name          String                                // "Day A - 胸+三头"
  day_of_week   Int?                                  // 0–6（NULL = 不固定）
  estimated_minutes Int?
  rest_seconds_default Int @default(90)              // 默认组间休息
  notes         String?
  
  plan          TrainingPlan @relation(fields: [plan_id], references: [id], onDelete: Cascade)
  exercises     TemplateExercise[]
  
  @@map("training_templates")
}
```

### 4.4 template_exercises（模板内动作清单）

```prisma
model TemplateExercise {
  id                String   @id @default(uuid())
  template_id       String
  exercise_id       String
  order_index       Int                              // 在模板中的顺序
  target_sets       Int                              // 目标组数
  target_reps_min   Int?
  target_reps_max   Int?
  target_rir        Decimal? @db.Decimal(3, 1)       // 目标 RIR
  target_rpe        Decimal? @db.Decimal(3, 1)
  rest_seconds      Int?                             // 覆盖模板默认
  tempo             String?                          // "3-1-1-0"
  notes             String?
  
  template          TrainingTemplate @relation(fields: [template_id], references: [id], onDelete: Cascade)
  exercise          Exercise         @relation(fields: [exercise_id], references: [id])
  
  @@unique([template_id, order_index])
  @@map("template_exercises")
}
```

### 4.5 workout_sessions（一次实际训练）

```prisma
model WorkoutSession {
  id                String   @id @default(uuid())
  user_id           String
  template_id       String?                          // NULL = 自由训练
  session_date      DateTime @db.Date
  start_time        DateTime?
  end_time          DateTime?
  overall_rpe       Decimal? @db.Decimal(3, 1)       // 主观 1–10
  bodyweight_kg     Decimal? @db.Decimal(6, 2)       // 当日训练时体重
  notes             String?
  
  // 离线幂等
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  user              User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  template          TrainingTemplate? @relation(fields: [template_id], references: [id])
  exercises         SessionExercise[]
  
  @@index([user_id, session_date])
  @@map("workout_sessions")
}
```

### 4.6 session_exercises（本次训练实际练的动作）

```prisma
model SessionExercise {
  id              String   @id @default(uuid())
  session_id      String
  exercise_id     String
  order_index     Int
  template_exercise_id String?                       // 关联模板项
  notes           String?
  
  session         WorkoutSession   @relation(fields: [session_id], references: [id], onDelete: Cascade)
  exercise        Exercise         @relation(fields: [exercise_id], references: [id])
  sets            SetEntry[]
  
  @@unique([session_id, order_index])
  @@map("session_exercises")
}
```

### 4.7 set_entries（核心数据点：每一组）

```prisma
model SetEntry {
  id                  String   @id @default(uuid())
  session_exercise_id String
  user_id             String                         // 冗余：避免每次按用户查都做两层 join
  exercise_id         String                         // 冗余：PR 检测高频按 (user, exercise) 查
  session_date        DateTime @db.Date              // 冗余：按 (user, date) 查训练
  
  set_index           Int                            // 1, 2, 3 ...
  set_type            SetType                        // 见枚举
  
  weight_kg           Decimal? @db.Decimal(6, 2)
  reps                Int?
  duration_seconds    Int?                           // 平板支撑/有氧用
  distance_m          Decimal? @db.Decimal(8, 2)     // 有氧用
  
  rir                 Decimal? @db.Decimal(3, 1)
  rpe                 Decimal? @db.Decimal(3, 1)
  tempo               String?                        // 格式 "ECC-PAUSE-CON-PAUSE"，例 "3-1-1-0"；服务端正则校验 ^\d-\d-\d-\d$
  rest_seconds        Int?                           // 与上一组的实际间隔
  
  is_failure          Boolean  @default(false)
  is_warmup           Boolean  @default(false)
  
  // 离线幂等
  client_op_id        String   @unique
  client_ts           DateTime
  
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?
  
  session_exercise    SessionExercise @relation(fields: [session_exercise_id], references: [id], onDelete: Cascade)
  
  @@index([session_exercise_id, set_index])
  @@index([user_id, session_date])
  @@index([user_id, exercise_id])                    // PR 检测主索引
  @@map("set_entries")
}

enum SetType { WARMUP WORKING DROP RESTPAUSE MYOREP CLUSTER AMRAP }
```

### 4.8 personal_records（PR 自动追踪）

```prisma
model PersonalRecord {
  id              String   @id @default(uuid())
  user_id         String
  exercise_id     String
  record_type     PRType                           // ONE_RM / VOLUME_BEST / REP_BEST
  value           Decimal  @db.Decimal(10, 2)
  reps            Int?                             // 用于 ONE_RM Epley 估算
  weight_kg       Decimal? @db.Decimal(6, 2)
  achieved_at     DateTime
  set_entry_id    String?                          // 来源 set
  
  @@unique([user_id, exercise_id, record_type])
  @@index([user_id, exercise_id])
  @@map("personal_records")
}

enum PRType { ONE_RM VOLUME_BEST REP_BEST }
```

#### PR 检测算法（应用层在 SetEntry 写入时执行，必须有单元测试）

```text
对每条新 SetEntry（仅 set_type IN ('WORKING', 'CLUSTER', 'AMRAP')，跳过 WARMUP）：

1. ONE_RM (Epley 公式)：
   estimated_1rm = weight_kg * (1 + reps / 30)
   若 estimated_1rm > 当前 PR.ONE_RM → 更新；reps > 10 时不刷新（公式失真）
   并列时取 weight_kg 更大者；再并列取最近时间

2. REP_BEST（同重量最多次数）：
   按 (user_id, exercise_id, weight_kg) 分组，若 reps > 现有 best → 更新
   （只追踪 weight_kg ≥ 当前 1RM 70% 的组，避免低重量噪音）

3. VOLUME_BEST（单次训练日某动作的总吨位）：
   计算同 session_date 下该 exercise 的 Σ(weight_kg × reps)
   超过历史最高 → 更新

> 触发逻辑：在 SetEntry 写入服务方法中调用 PrService.detectAndUpdate(setEntry)；
> 不使用数据库触发器（便于单元测试 + 离线批量回放时一致）。
```

> 修订（R2）：评审 P1-15 指出未写算法；本节标明 Epley 公式 + 选举规则 + 落地位置。

---

## 5. 营养域（Loop B 核心）

### 5.1 foods（全局食材库）

```prisma
model Food {
  id              String   @id @default(uuid())
  name_zh         String
  name_en         String?
  brand           String?
  barcode         String?  @unique
  
  // per 100g 标准化
  kcal_per_100g       Decimal  @db.Decimal(8, 2)
  protein_per_100g    Decimal  @db.Decimal(6, 2)
  carbs_per_100g      Decimal  @db.Decimal(6, 2)
  fat_per_100g        Decimal  @db.Decimal(6, 2)
  fiber_per_100g      Decimal? @db.Decimal(6, 2)
  sugar_per_100g      Decimal? @db.Decimal(6, 2)
  sodium_mg_per_100g  Decimal? @db.Decimal(8, 2)
  potassium_mg_per_100g Decimal? @db.Decimal(8, 2)
  
  // 单位换算
  default_serving_g   Decimal? @db.Decimal(8, 2)     // 一份 = ? g
  serving_name        String?                         // "一勺" / "一个"
  
  category        FoodCategory                        // 大类
  is_official     Boolean  @default(true)
  created_by      String?                             // user_id
  verified        Boolean  @default(false)
  
  created_at      DateTime @default(now())
  
  @@index([name_zh])
  @@index([barcode])
  @@map("foods")
}

enum FoodCategory {
  MEAT_PROTEIN SEAFOOD DAIRY EGGS GRAIN VEGETABLE FRUIT NUTS_SEEDS
  OIL_FAT SAUCE_CONDIMENT BEVERAGE PROTEIN_POWDER MEAL_REPLACEMENT
  PROCESSED_FOOD FAST_FOOD RESTAURANT OTHER
}
```

### 5.2 recipes / recipe_ingredients

```prisma
model Recipe {
  id            String   @id @default(uuid())
  user_id       String
  name          String                                // "备赛碗 v3"
  description   String?
  serving_count Int      @default(1)                  // 几人份
  
  // 缓存计算（写入时自动）
  total_kcal    Decimal? @db.Decimal(8, 2)
  total_protein Decimal? @db.Decimal(6, 2)
  total_carbs   Decimal? @db.Decimal(6, 2)
  total_fat     Decimal? @db.Decimal(6, 2)
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
  
  ingredients   RecipeIngredient[]
  
  @@index([user_id])
  @@map("recipes")
}

model RecipeIngredient {
  id          String   @id @default(uuid())
  recipe_id   String
  food_id     String
  grams       Decimal  @db.Decimal(8, 2)
  order_index Int
  
  recipe      Recipe @relation(fields: [recipe_id], references: [id], onDelete: Cascade)
  food        Food   @relation(fields: [food_id], references: [id])
  
  @@map("recipe_ingredients")
}
```

### 5.3 meal_logs / meal_items

```prisma
model MealLog {
  id              String   @id @default(uuid())
  user_id         String
  meal_slot       MealSlot
  consumed_at     DateTime                          // UTC
  meal_date       DateTime @db.Date                 // 用户本地日期（用于聚合）
  is_planned      Boolean  @default(false)          // 是否按计划完成
  notes           String?
  
  // 缓存反算（在 items 变更时由 service 更新）
  total_kcal      Decimal? @db.Decimal(8, 2)
  total_protein   Decimal? @db.Decimal(6, 2)
  total_carbs     Decimal? @db.Decimal(6, 2)
  total_fat       Decimal? @db.Decimal(6, 2)
  
  // 离线幂等
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?
  
  user            User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  items           MealItem[]
  
  @@index([user_id, meal_date])
  @@map("meal_logs")
}

enum MealSlot {
  PRE_WORKOUT INTRA_WORKOUT POST_WORKOUT
  BREAKFAST MORNING_SNACK LUNCH AFTERNOON_SNACK
  PRE_DINNER DINNER LATE_NIGHT
}

model MealItem {
  id          String   @id @default(uuid())
  meal_log_id String
  food_id     String?                              // 食材方式
  recipe_id   String?                              // 配方方式
  grams       Decimal  @db.Decimal(8, 2)
  
  // 计算快照（防止 food macros 修改后旧记录变化）
  snapshot_kcal     Decimal @db.Decimal(8, 2)
  snapshot_protein  Decimal @db.Decimal(6, 2)
  snapshot_carbs    Decimal @db.Decimal(6, 2)
  snapshot_fat      Decimal @db.Decimal(6, 2)
  
  // 独立写端点（PATCH/DELETE /meals/items/:id）→ 强制幂等
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  meal_log    MealLog @relation(fields: [meal_log_id], references: [id], onDelete: Cascade)
  food        Food?   @relation(fields: [food_id], references: [id])
  recipe      Recipe? @relation(fields: [recipe_id], references: [id])
  
  // XOR 约束：food_id 与 recipe_id 必须且仅有一个（Prisma 不支持原生 CHECK，
  // 应用层 service 强制 + 数据库迁移中追加：
  //   CHECK ((food_id IS NULL) <> (recipe_id IS NULL))
  // ）
  
  @@map("meal_items")
}
```

> 修订（R2）：评审 P0-6 / P1-30 — 补 `client_op_id` + 时间戳；加 XOR 约束说明。

### 5.4 meal_plan_templates / scheduled_meals（"今日计划餐"实体）

> **新增表（R2）。** 评审 P0-1 指出 PRD Loop B 和 API `/meals/quick-log` 依赖"今日计划餐"，但原 schema 仅有 `is_planned` Boolean，无法回答"今天应该吃哪 5 餐、每餐用哪个 recipe、什么时间"。

```prisma
// 一个备赛阶段的餐单模板（如 "PREP Week 1-4 餐单"）
model MealPlanTemplate {
  id            String   @id @default(uuid())
  user_id       String
  name          String                              // "PREP W1-4 - 5 餐计划"
  phase_config_id String?                           // 关联到 PrepCycle 的某 PhaseConfig
  
  // 计划总 macros（应与 phase_config 一致；缓存）
  total_kcal    Int
  total_protein_g Int
  total_carbs_g Int
  total_fat_g   Int
  
  is_active     Boolean  @default(false)            // 当前激活模板
  
  client_op_id  String   @unique
  client_ts     DateTime
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
  
  scheduled_meals ScheduledMeal[]
  
  @@index([user_id, is_active])
  @@map("meal_plan_templates")
}

// 模板内的"第 N 餐"
model ScheduledMeal {
  id                String   @id @default(uuid())
  template_id       String
  order_index       Int                             // 一天内第几餐
  meal_slot         MealSlot
  target_time       String                          // "07:00" 用户本地时区
  
  // 该餐的目标 macros
  target_kcal       Int
  target_protein_g  Int
  target_carbs_g    Int
  target_fat_g      Int
  
  // 两种填法二选一：
  recipe_id         String?                         // 整餐用某配方
  // 或自由组合食材：
  ingredients       ScheduledMealIngredient[]
  
  notes             String?
  
  template          MealPlanTemplate @relation(fields: [template_id], references: [id], onDelete: Cascade)
  recipe            Recipe? @relation(fields: [recipe_id], references: [id])
  
  @@unique([template_id, order_index])
  @@map("scheduled_meals")
}

model ScheduledMealIngredient {
  id              String   @id @default(uuid())
  scheduled_meal_id String
  food_id         String
  grams           Decimal  @db.Decimal(8, 2)
  
  scheduled_meal  ScheduledMeal @relation(fields: [scheduled_meal_id], references: [id], onDelete: Cascade)
  food            Food @relation(fields: [food_id], references: [id])
  
  @@map("scheduled_meal_ingredients")
}
```

**fan-out 规则**（service 层实现）：当用户调用 `POST /meals/quick-log { scheduled_meal_id }` 时：
1. 读取 `ScheduledMeal` + 其 `recipe` 或 `ingredients`
2. 创建 `MealLog`（`is_planned=true`、`meal_slot` 复制）
3. fan-out 创建对应 `MealItem`，snapshot macros 全部填充
4. 整个操作绑定父级 `client_op_id`（如父 op 已存在则返回已有结果）

### 5.5 缓存失效矩阵（MealLog.total_* / Recipe.total_*）

| 触发操作 | 需重算的缓存 |
|---|---|
| `MealItem` CREATE/UPDATE/DELETE | 对应 `MealLog.total_kcal/protein/carbs/fat` |
| `Food.{kcal/protein/carbs/fat}_per_100g` 被官方修订 | **不**触发回填——`MealItem.snapshot_*` 保护历史不变；新 MealItem 自动取新值 |
| `RecipeIngredient` 变更 | 对应 `Recipe.total_*`；**不**回填已引用此 recipe 的旧 `MealItem`（snapshot 保护） |
| `MealLog` DELETE | `DailySummary` 当日所有营养字段 |
| `MacroTarget` 变更 | `DailySummary.kcal_target_pct` 当日 |

> 修订（R2）：评审 P1-26 指出原文档未规定缓存失效规则；本表给出全部触发-重算映射。

### 5.6 water_logs / electrolyte_logs

```prisma
model WaterLog {
  id          String   @id @default(uuid())
  user_id     String
  ml          Int
  consumed_at DateTime
  log_date    DateTime @db.Date
  
  client_op_id String  @unique
  client_ts    DateTime
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  
  @@index([user_id, log_date])
  @@map("water_logs")
}

model ElectrolyteLog {
  id          String   @id @default(uuid())
  user_id     String
  sodium_mg     Decimal? @db.Decimal(8, 2)
  potassium_mg  Decimal? @db.Decimal(8, 2)
  magnesium_mg  Decimal? @db.Decimal(8, 2)
  source        String?                            // "Pickle Juice" / "盐胶囊"
  consumed_at   DateTime
  log_date      DateTime @db.Date
  
  client_op_id  String   @unique
  client_ts     DateTime
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?
  
  @@index([user_id, log_date])
  @@map("electrolyte_logs")
}
```

> 修订（R2）：评审 P0-6 / P2-37 — 补 client_ts + 标准时间戳 + deleted_at。

### 5.7 last_value_cache（UX 准则 1 的物理基础）

> **新增（R2）**。评审 P0-5 指出 UX §1（"昨天怎么做今天就怎么做"）和 API `/workouts/sessions/start.suggested_sets` 依赖此缓存，但原 schema 无表。

```prisma
// 单实体缓存"最近一次值"，写入侧由 SetEntry / MealLog / SupplementLog 等的 service 维护
model LastValueCache {
  id              String   @id @default(uuid())
  user_id         String
  domain          LastValueDomain                  // SET / MEAL_ITEM / SUPPLEMENT_DOSE
  key             String                           // 复合键拼装：
                                                   //   SET → "{exercise_id}:{set_index}"
                                                   //   MEAL_ITEM → "{meal_slot}:{food_id}"
                                                   //   SUPPLEMENT_DOSE → "{supplement_item_id}"
  value           Json                             // SET → { weight_kg, reps, rir, rest_seconds, tempo }
                                                   // MEAL_ITEM → { grams }
                                                   // SUPPLEMENT_DOSE → { dose, unit }
  occurred_at     DateTime                         // 来源记录的 client_ts
  updated_at      DateTime @updatedAt
  
  @@unique([user_id, domain, key])
  @@index([user_id, domain])
  @@map("last_value_cache")
}

enum LastValueDomain { SET MEAL_ITEM SUPPLEMENT_DOSE }
```

**写入触发**：在 `SetEntry` / `MealItem` / `SupplementLog` 写入服务中调用 `LastValueService.upsert(domain, key, value, occurred_at)`，仅当 `occurred_at > 现有值的 occurred_at` 时覆盖（防止离线乱序回放破坏"最新"语义）。

**API 引用**：
- `POST /workouts/sessions/start` 的 `suggested_sets` 字段：按模板的每个 (exercise_id, set_index) 查 `LastValueCache.value`，缺失则 fallback 到该模板项的 `target_*`
- `GET /supplements/schedules` 的 dose 默认值同理

### 5.8 macro_targets（备赛系统自动写入或手动覆盖）

```prisma
model MacroTarget {
  id              String   @id @default(uuid())
  user_id         String
  target_date     DateTime @db.Date
  kcal            Int
  protein_g       Int
  carbs_g         Int
  fat_g           Int
  
  source          TargetSource                     // AUTO_PREP / MANUAL / COACH
  prep_cycle_id   String?
  
  created_at      DateTime @default(now())
  
  @@unique([user_id, target_date])
  @@map("macro_targets")
}

enum TargetSource { AUTO_PREP MANUAL COACH }
```

---

## 6. 补剂模块（含 §14 PED 子模块）

### 6.1 supplement_schedules（补剂套餐模板）

```prisma
model SupplementSchedule {
  id          String   @id @default(uuid())
  user_id     String
  name        String                                // "早间套餐" / "训练前套餐"
  time_slot   String                                // "07:00" / "PRE_WORKOUT"
  is_active   Boolean  @default(true)
  
  client_op_id String  @unique
  client_ts    DateTime
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  
  items       SupplementItem[]
  
  @@map("supplement_schedules")
}

model SupplementItem {
  id              String   @id @default(uuid())
  schedule_id     String
  name            String                            // "乳清蛋白"
  brand           String?
  dose            Decimal? @db.Decimal(8, 2)
  unit            String?                            // "g" / "粒" / "勺"
  notes           String?
  is_controlled   Boolean  @default(false)         // 受控物质（PED 标记，§14）
  
  schedule        SupplementSchedule @relation(fields: [schedule_id], references: [id], onDelete: Cascade)
  
  @@map("supplement_items")
}
```

### 6.2 supplement_logs（打卡）

```prisma
model SupplementLog {
  id                String   @id @default(uuid())
  user_id           String
  schedule_id       String?                         // 来自哪个套餐
  item_id           String?                         // 来自哪个具体项
  name              String                          // 冗余存储，模板被删后仍可看
  dose              Decimal? @db.Decimal(8, 2)
  unit              String?
  taken_at          DateTime
  log_date          DateTime @db.Date
  is_controlled     Boolean  @default(false)
  
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  @@index([user_id, log_date])
  @@map("supplement_logs")
}
```

---

## 7. 体测域

### 7.1 body_records

```prisma
model BodyRecord {
  id                    String   @id @default(uuid())
  user_id               String
  measurement_date      DateTime @db.Date
  
  // 称重（晨重/晚重分开，备赛核心指标）
  morning_weight_kg     Decimal? @db.Decimal(6, 2)
  evening_weight_kg     Decimal? @db.Decimal(6, 2)
  
  // 身体成分
  body_fat_percentage   Decimal? @db.Decimal(5, 2)
  muscle_mass_kg        Decimal? @db.Decimal(6, 2)
  visceral_fat_index    Decimal? @db.Decimal(4, 1)
  
  // 围度（cm）
  chest_cm              Decimal? @db.Decimal(6, 2)
  shoulder_cm           Decimal? @db.Decimal(6, 2)
  waist_cm              Decimal? @db.Decimal(6, 2)
  hip_cm                Decimal? @db.Decimal(6, 2)
  arm_left_cm           Decimal? @db.Decimal(6, 2)
  arm_right_cm          Decimal? @db.Decimal(6, 2)
  thigh_left_cm         Decimal? @db.Decimal(6, 2)
  thigh_right_cm        Decimal? @db.Decimal(6, 2)
  calf_left_cm          Decimal? @db.Decimal(6, 2)
  calf_right_cm         Decimal? @db.Decimal(6, 2)
  neck_cm               Decimal? @db.Decimal(6, 2)
  
  // 主观指标（备赛核心）
  subjective_condition  Int?     // 1–10
  water_retention_score Int?     // 1–5
  sleep_hours           Decimal? @db.Decimal(3, 1)
  energy_score          Int?     // 1–5
  
  notes                 String?
  
  client_op_id          String   @unique
  client_ts             DateTime
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  deleted_at            DateTime?
  
  user                  User             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  photos                ProgressPhoto[]
  
  @@unique([user_id, measurement_date])
  @@index([user_id, measurement_date])
  @@map("body_records")
}
```

### 7.2 progress_photos

```prisma
model ProgressPhoto {
  id              String   @id @default(uuid())
  user_id         String
  body_record_id  String?
  weekly_check_in_id String?                        // 关联到周 check-in（§8.4）
  photo_date      DateTime @db.Date
  
  url             String                            // 对象存储 URL
  thumbnail_url   String?
  angle           PhotoAngle                        // FRONT / BACK / SIDE_LEFT / SIDE_RIGHT
  pose            PhotoPose                         // RELAXED / FRONT_DOUBLE_BICEPS / MOST_MUSCULAR / ...
  
  width           Int?
  height          Int?
  file_size_kb    Int?
  
  visibility      Visibility @default(SELF_ONLY)    // 默认仅自己（§14 准则）
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?
  
  body_record     BodyRecord? @relation(fields: [body_record_id], references: [id], onDelete: SetNull)
  weekly_check_in WeeklyCheckIn? @relation("CheckInPhotos", fields: [weekly_check_in_id], references: [id], onDelete: SetNull)
  
  @@index([user_id, photo_date])
  @@index([weekly_check_in_id])
  @@map("progress_photos")
}

enum PhotoAngle { FRONT BACK SIDE_LEFT SIDE_RIGHT }
enum PhotoPose  { RELAXED FRONT_DOUBLE_BICEPS BACK_DOUBLE_BICEPS SIDE_CHEST SIDE_TRICEPS MOST_MUSCULAR ABS_AND_THIGHS QUARTER_TURN_LEFT QUARTER_TURN_RIGHT OTHER }
enum Visibility { SELF_ONLY COACH_VISIBLE PUBLIC_OPT_IN }
```

---

## 8. 备赛域

### 8.1 competition_goals

```prisma
model CompetitionGoal {
  id                String   @id @default(uuid())
  user_id           String
  name              String                            // "2026 黄金联赛"
  federation        String?                           // IFBB / NPC / CBBA
  category          String?                           // 古典 / 健体 / 健美
  stage_date        DateTime @db.Date
  location          String?
  target_weight_kg  Decimal? @db.Decimal(6, 2)
  notes             String?
  
  is_active         Boolean  @default(true)
  
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  user              User           @relation(fields: [user_id], references: [id], onDelete: Cascade)
  prep_cycles       PrepCycle[]
  
  @@map("competition_goals")
}
```

### 8.2 prep_cycles（备赛周期，绑定 goal）

```prisma
model PrepCycle {
  id              String   @id @default(uuid())
  user_id         String
  goal_id         String
  start_date      DateTime @db.Date
  end_date        DateTime @db.Date                  // = goal.stage_date
  current_phase   PrepPhase @default(PREP)
  weeks_total     Int
  // weeks_remaining: 不存（运行时算）—— 修订（R2）评审 P1-18：
  //   原方案"定时任务每日更新"既受时区影响又增加测试成本，且违反 UX §1.4"零数学"
  //   规则：weeks_remaining = ceil((end_date - today_in_user_tz) / 7)，由 API 层返回
  
  // 起始指标（用于全程对比）
  start_weight_kg     Decimal? @db.Decimal(6, 2)
  start_body_fat_pct  Decimal? @db.Decimal(5, 2)
  
  is_active       Boolean  @default(true)
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  goal            CompetitionGoal @relation(fields: [goal_id], references: [id], onDelete: Cascade)
  phases          PhaseConfig[]
  check_ins       WeeklyCheckIn[]
  meal_plan_templates MealPlanTemplate[] @relation("PrepMealPlans")
  
  @@index([user_id])
  @@map("prep_cycles")
}

enum PrepPhase { OFFSEASON PREP PEAK_WEEK STAGE_DAY REBOUND }
```

### 8.3 phase_configs（每个阶段的 macros / cardio 参数）

```prisma
model PhaseConfig {
  id              String   @id @default(uuid())
  prep_cycle_id   String
  phase           PrepPhase
  week_start      Int                                // 从第几周开始（1-indexed）
  week_end        Int
  
  // Macros
  kcal            Int
  protein_g       Int
  carbs_g         Int
  fat_g           Int
  
  // 有氧
  cardio_sessions_per_week  Int @default(0)
  cardio_minutes_per_session Int @default(0)
  cardio_type     String?                            // "LISS" / "HIIT" / "Steps 12k"
  
  // 步数目标
  daily_steps     Int?
  
  // 其他
  refeed_day      Int?                               // 每周第几天 refeed
  notes           String?
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  prep_cycle      PrepCycle @relation(fields: [prep_cycle_id], references: [id], onDelete: Cascade)
  
  @@map("phase_configs")
}

// ============= 8.5 peak_protocol_templates（PEAK week 操作模板）=============
// 修订（R2）：评审 P1-20 — 原 timeline W8 提到 "Peak week 协议模板"，但 schema 无落地。
model PeakProtocolTemplate {
  id              String   @id @default(uuid())
  user_id         String?                            // null = 官方模板
  name            String                             // "Classic Carb Depletion Peak"
  description     String?
  
  // 7 天的水/钠/糖配置（数组长度固定 7，按 stage_date 倒数 D-7..D-0）
  daily_water_ml         Int[]                       // 例 [6000,6000,6000,5000,4000,3000,500]
  daily_sodium_mg        Int[]
  daily_carbs_g          Int[]
  daily_protein_g        Int[]
  daily_fat_g            Int[]
  
  notes_per_day          Json                        // 每天的文字提示
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@map("peak_protocol_templates")
}
```

### 8.4 weekly_check_ins（Loop C 核心）

```prisma
model WeeklyCheckIn {
  id                  String   @id @default(uuid())
  user_id             String
  prep_cycle_id       String?
  week_index          Int                            // 本周期内第几周
  check_in_date       DateTime @db.Date
  
  // 自动预填字段（系统聚合过去 7 天）
  avg_morning_weight  Decimal? @db.Decimal(6, 2)
  weight_change_kg    Decimal? @db.Decimal(6, 2)
  avg_kcal_actual     Int?
  avg_steps           Int?
  trainings_completed Int?
  cardio_minutes_total Int?
  
  // 手填字段
  subjective_condition Int?                          // 1–10
  hunger_score        Int?                           // 1–5
  sleep_quality_score Int?                           // 1–5
  stress_score        Int?                           // 1–5
  
  athlete_notes       String?                        // 运动员留言
  
  // 教练反馈
  coach_response_at   DateTime?
  coach_notes         String?
  // coach_adjustment JSON 拆为列（修订 R2 评审 P1-29）
  coach_adjustment_kcal_delta      Int?
  coach_adjustment_protein_delta_g Int?
  coach_adjustment_carbs_delta_g   Int?
  coach_adjustment_fat_delta_g     Int?
  coach_adjustment_cardio_min_delta Int?
  coach_adjustment_steps_delta     Int?
  coach_adjustment_effective_from  DateTime? @db.Date
  
  status              CheckInStatus @default(PENDING)
  
  client_op_id        String   @unique
  client_ts           DateTime
  
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?
  
  prep_cycle          PrepCycle? @relation(fields: [prep_cycle_id], references: [id], onDelete: SetNull)
  photos              ProgressPhoto[] @relation("CheckInPhotos")
  // 注：CoachComment 已去多态 FK（评审 P0-2），应用层按 target_type=CHECK_IN + target_id=this.id 关联
  
  @@index([user_id, check_in_date])
  @@map("weekly_check_ins")
}

enum CheckInStatus { PENDING SUBMITTED COACH_REVIEWED ACKNOWLEDGED }
```

---

## 9. 消费域

### 9.1 expenses（12 类）

```prisma
model Expense {
  id                  String   @id @default(uuid())
  user_id             String
  category            ExpenseCategory
  amount              Decimal  @db.Decimal(12, 2)
  currency            String   @default("CNY")
  description         String?
  expense_date        DateTime @db.Date
  
  // 关联（可空）
  linked_food_id      String?                        // 食材采购关联
  linked_supplement_item_id String?                  // 补剂支出关联
  linked_competition_id String?                      // 比赛相关
  
  recurring_id        String?                        // 来自循环账单
  receipt_photo_url   String?
  
  client_op_id        String   @unique
  client_ts           DateTime
  
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?
  
  user                User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id, expense_date])
  @@index([user_id, category])
  @@map("expenses")
}

enum ExpenseCategory {
  FOOD_GROCERY        // 食材采购
  DINING_OUT          // 外食
  SUPPLEMENT          // 普通补剂
  COACH_FEE           // 教练费
  GYM_MEMBERSHIP      // 健身房月卡
  EQUIPMENT           // 设备购置
  APPAREL_POSING      // 服装 / posing 装备
  COMPETITION_FEE     // 报名费
  TRAVEL_COMPETITION  // 比赛差旅
  RECOVERY            // 按摩 / 桑拿 / 物理治疗
  OTHER
}

// 修订（R2）：评审 P0-8 —— 原 ExpenseCategory.CONTROLLED 会被 /expenses 普通接口读到，
// 违反 §14 PED 隔离原则；改为独立表，所有读 / 导出 / 报表 API 都不应触达该表，
// 仅 /controlled/expenses 路由可访问，且要求 ControlledPinSession。

model ControlledExpense {
  id                  String   @id @default(uuid())
  user_id             String
  controlled_cycle_id String?
  amount              Decimal  @db.Decimal(12, 2)
  currency            String   @default("CNY")
  compound            String?                        // 关联 controlled_protocol_items.compound
  description         String?
  expense_date        DateTime @db.Date
  
  client_op_id        String   @unique
  client_ts           DateTime
  
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?
  
  @@index([user_id, expense_date])
  @@map("controlled_expenses")
}
```

### 9.2 budget_months / recurring_expenses

```prisma
model BudgetMonth {
  id                String   @id @default(uuid())
  user_id           String
  year              Int
  month             Int
  total_budget      Decimal  @db.Decimal(12, 2)
  
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  lines             BudgetCategoryLine[]              // 修订（R2）评审 P1-29：JSON 拆子表
  
  @@unique([user_id, year, month])
  @@map("budget_months")
}

model BudgetCategoryLine {
  id                String   @id @default(uuid())
  budget_month_id   String
  category          ExpenseCategory
  amount            Decimal  @db.Decimal(12, 2)
  
  budget_month      BudgetMonth @relation(fields: [budget_month_id], references: [id], onDelete: Cascade)
  
  @@unique([budget_month_id, category])
  @@map("budget_category_lines")
}

model RecurringExpense {
  id                String   @id @default(uuid())
  user_id           String
  name              String                            // "健身房月卡"
  category          ExpenseCategory
  amount            Decimal  @db.Decimal(12, 2)
  cycle             RecurringCycle                    // MONTHLY / QUARTERLY / YEARLY
  next_run_date     DateTime @db.Date
  is_active         Boolean  @default(true)
  
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  @@index([user_id, next_run_date])
  @@map("recurring_expenses")
}

enum RecurringCycle { WEEKLY MONTHLY QUARTERLY YEARLY }
```

---

## 10. 教练协同域

### 10.1 coach_profiles

```prisma
model CoachProfile {
  user_id           String   @id                     // 与 User 1:1
  certifications    String[]                         // ["NSCA CSCS", "IFBB Pro"]
  specialties       String[]                         // ["Contest Prep", "Posing"]
  bio               String?
  hourly_rate       Decimal? @db.Decimal(10, 2)
  currency          String   @default("CNY")
  athlete_capacity  Int      @default(25)
  
  @@map("coach_profiles")
}
```

### 10.2 coach_athlete_links（多对多 + **模块级**权限）

> 修订（R2）：评审 P1-11 — PRD 原称"字段级权限"，实际是模块级，措辞已在 PRD §5.4 同步修正。  
> 评审 P1-13 — 加 partial unique 强制 Athlete Pro 仅可同时关联 1 名教练。  
> 评审 P1-29 — `scopes` 由 JSON 改成 booleans。

```prisma
model CoachAthleteLink {
  id              String   @id @default(uuid())
  coach_id        String
  athlete_id      String
  
  status          LinkStatus @default(PENDING)       // PENDING / ACTIVE / PAUSED / ENDED
  invited_by      InviteSource                       // COACH / ATHLETE
  
  // 模块级权限（原 scopes Json 拆为 booleans，便于索引 + 类型安全）
  scope_training         Boolean @default(true)
  scope_nutrition        Boolean @default(true)
  scope_body_basic       Boolean @default(true)      // 体重/围度
  scope_body_photos      Boolean @default(false)     // 照片单独控制（敏感）
  scope_expenses         Boolean @default(false)
  scope_controlled       Boolean @default(false)     // 仅当为 true 时，教练 PED 视图才能用 ControlledViewToken 路径
  
  started_at      DateTime?
  ended_at        DateTime?
  
  monthly_fee     Decimal? @db.Decimal(10, 2)
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  coach           User @relation("coach",   fields: [coach_id],   references: [id])
  athlete         User @relation("athlete", fields: [athlete_id], references: [id])
  
  @@unique([coach_id, athlete_id])
  @@index([coach_id, status])
  @@index([athlete_id, status])
  // 数据库迁移补：
  //   CREATE UNIQUE INDEX coach_link_active_one_per_athlete
  //     ON coach_athlete_links(athlete_id) WHERE status = 'ACTIVE';
  // 强制每个学员同一时刻最多 1 个 ACTIVE 教练（Athlete Pro 档；FREE 档由 service 阻止接受邀请）。
  @@map("coach_athlete_links")
}

enum LinkStatus   { PENDING ACTIVE PAUSED ENDED }
enum InviteSource { COACH ATHLETE }
```

### 10.3 coach_invitations（解决 P0-7 — API 引用但 schema 缺失）

```prisma
model CoachInvitation {
  id              String   @id @default(uuid())
  coach_id        String
  invite_code     String   @unique                   // 短码（如 8 位 base32）
  athlete_email   String?                            // 可选定向
  expires_at      DateTime
  accepted_at     DateTime?
  accepted_by     String?                            // user_id
  revoked_at      DateTime?
  
  created_at      DateTime @default(now())
  
  @@index([coach_id])
  @@index([invite_code])
  @@map("coach_invitations")
}
```

### 10.4 coach_comments（**去掉多态外键**，解决 P0-2）

> 修订（R2）：评审 P0-2 — Prisma 不支持原生多态外键。  
> 选定方案：去掉 `check_in` 反向关系字段，`target_id` 仅做应用层关联（不带 RI 与级联删除）；  
> 应用层在删除目标记录时显式删除关联评论。

```prisma
model CoachComment {
  id              String   @id @default(uuid())
  coach_id        String
  athlete_id      String
  
  target_type     CommentTarget                      // CHECK_IN / SESSION / MEAL / PHOTO / BODY_RECORD
  target_id       String                             // 应用层多态 ID，不做 FK
  
  content         String
  is_actionable   Boolean  @default(false)           // 是否需要运动员确认
  acknowledged_at DateTime?
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?
  
  @@index([athlete_id, target_type, target_id])
  @@index([coach_id])
  @@map("coach_comments")
}

enum CommentTarget { CHECK_IN SESSION MEAL PHOTO BODY_RECORD }
```

### 10.5 reminder_rules（解决 P1-19 — UX §1.5 提到的 7 类推送都需要调度实体）

```prisma
model ReminderRule {
  id              String   @id @default(uuid())
  user_id         String
  rule_type       ReminderType
  schedule_expr   String                             // cron 表达式或 "RELATIVE:-30m:WORKOUT_START"
  channel         ReminderChannel @default(PUSH)     // PUSH / EMAIL
  payload         Json?                              // 自定义文案 / 模板 id
  enabled         Boolean  @default(true)
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  user            User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id, rule_type, enabled])
  @@map("reminder_rules")
}

enum ReminderType {
  PRE_WORKOUT_30M
  REST_BETWEEN_SETS              // 由 SetEntry 写入触发，非 cron
  MEAL_DUE
  PROTEIN_DEFICIT_NIGHT
  CHECKIN_SUNDAY_20
  COACH_REPLY_RECEIVED           // 事件驱动
  PEAK_WEEK_T_MINUS_7            // PrepCycle 倒数 7 天触发
}

enum ReminderChannel { PUSH EMAIL }
```

---

## 11. 分析域（缓存表）

### 11.1 daily_summaries（替代 v1，加字段）

```prisma
model DailySummary {
  id                    String   @id @default(uuid())
  user_id               String
  summary_date          DateTime @db.Date
  
  // 营养（来自 meal_logs）
  total_kcal            Int?
  total_protein         Decimal? @db.Decimal(8, 2)
  total_carbs           Decimal? @db.Decimal(8, 2)
  total_fat             Decimal? @db.Decimal(8, 2)
  total_fiber           Decimal? @db.Decimal(8, 2)
  meals_count           Int      @default(0)
  
  // 训练（来自 sessions）
  workout_minutes       Int      @default(0)
  total_volume_kg       Decimal? @db.Decimal(12, 2)
  total_sets            Int      @default(0)
  avg_rpe               Decimal? @db.Decimal(3, 1)
  
  // 水分
  water_ml              Int      @default(0)
  
  // 体测
  morning_weight_kg     Decimal? @db.Decimal(6, 2)
  steps                 Int?                          // 来自外部健康数据
  
  // Macro 达成率（vs MacroTarget）
  kcal_target           Int?
  kcal_target_pct       Decimal? @db.Decimal(5, 2)
  
  // 北极星指标支撑（修订 R2，评审 P1-28）
  is_complete           Boolean  @default(false)
  // 完整日 = 全部满足：
  //   1. meals_count ≥ 该用户当日 ScheduledMeal 数 × 80%（且 ≥ 4 餐）
  //   2. workout_minutes > 0 OR 当日 PhaseConfig.cardio_sessions_per_week 摊到当日已记
  //   3. morning_weight_kg IS NOT NULL
  //   4. supplement_logs_count ≥ 当日 SupplementSchedule 总条目 × 80%
  // 由 DailySummaryRebuildJob 在每日 00:30（用户本地时区）回算
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  @@unique([user_id, summary_date])
  @@index([user_id, summary_date])
  @@index([user_id, is_complete])
  @@map("daily_summaries")
}
```

---

## 12. 系统域

### 12.1 sync_queue（仅服务端日志，运行时排错用）

```prisma
model SyncEvent {
  id              String   @id @default(uuid())
  user_id         String
  client_op_id    String
  entity_type     String                              // "SetEntry" / "MealLog"
  entity_id       String?
  operation       String                              // CREATE / UPDATE / DELETE
  status          SyncStatus                          // OK / CONFLICT / FAILED
  conflict_field  String?
  resolution      String?                             // LWW / MERGE / MANUAL
  received_at     DateTime @default(now())
  
  @@index([user_id, received_at])
  @@map("sync_events")
}

enum SyncStatus { OK CONFLICT FAILED }
```

### 12.2 push_subscriptions

```prisma
model PushSubscription {
  id              String   @id @default(uuid())
  user_id         String
  endpoint        String   @unique
  p256dh          String
  auth            String
  user_agent      String?
  created_at      DateTime @default(now())
  
  @@index([user_id])
  @@map("push_subscriptions")
}
```

### 12.3 audit_logs（敏感操作）

```prisma
model AuditLog {
  id              String   @id @default(uuid())
  actor_user_id   String
  action          String                              // "CONTROLLED_MODULE_VIEWED" / "PHOTO_EXPORTED" / ...
  target_type     String?
  target_id       String?
  ip              String?
  user_agent      String?
  created_at      DateTime @default(now())
  
  @@index([actor_user_id, created_at])
  @@index([action, created_at])
  @@map("audit_logs")
}
```

---

## 13. 索引清单（性能关键路径）

```sql
-- 训练
CREATE INDEX idx_set_entries_session ON set_entries(session_exercise_id, set_index);
CREATE INDEX idx_session_user_date ON workout_sessions(user_id, session_date DESC);
CREATE INDEX idx_pr_user_exercise ON personal_records(user_id, exercise_id);

-- 营养（高频查询：今日所有餐）
CREATE INDEX idx_meal_user_date ON meal_logs(user_id, meal_date DESC);
-- 食材中文搜索：修订（R2）评审 P1-10
-- 原方案 to_tsvector('simple', ...) 不切中文 → 退化为全表扫
-- 选定方案 A：trigram（pg_trgm 扩展），子串与拼写容错都行，无需中文分词器
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_food_name_zh_trgm ON foods USING gin (name_zh gin_trgm_ops);
CREATE INDEX idx_food_name_en_trgm ON foods USING gin (name_en gin_trgm_ops);
-- 备选方案 B（若 v2.1 需要更高精度）：安装 pg_jieba 后改 to_tsvector('jiebacfg', name_zh)
CREATE INDEX idx_food_barcode ON foods(barcode);

-- 教练看板
CREATE INDEX idx_coach_athlete_active ON coach_athlete_links(coach_id, status) WHERE status = 'ACTIVE';

-- 备赛
CREATE INDEX idx_prep_active ON prep_cycles(user_id, is_active) WHERE is_active = true;

-- 同步幂等
CREATE UNIQUE INDEX idx_sync_client_op ON sync_events(client_op_id);  -- 已由 @unique 自动建
```

---

## 14. 受控物质（PED）子模块设计

> **本节是产品决策 §5.5 的技术落地。任何接触该模块的代码必须独立 code-review。**

### 14.1 入口控制

- `users.controlled_module_enabled = false` 是默认值
- 用户在设置中开启 → 阅读免责声明 → 设 PIN → 才能访问以下表
- 应用商店分发版本可通过 **build flag** 永久禁用该模块

### 14.2 数据隔离

所有受控数据**不进**普通报表 API。

新增独立表：

```prisma
model ControlledCycle {
  id                String   @id @default(uuid())
  user_id           String
  name              String                              // "Cycle 1 - Off-season"
  start_date        DateTime @db.Date
  end_date          DateTime? @db.Date
  notes_encrypted   String?                             // 客户端加密后存储（可选高级方案）
  is_active         Boolean  @default(true)
  
  client_op_id      String   @unique
  client_ts         DateTime
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?
  
  protocol_items    ControlledProtocolItem[]
  doses             ControlledDoseLog[]
  bloodwork         BloodworkResult[]
  
  @@index([user_id])
  @@map("controlled_cycles")
}

model ControlledProtocolItem {
  id              String   @id @default(uuid())
  cycle_id        String
  compound        String                                // "Test E" / "Trenbolone"
  weekly_dose_mg  Decimal? @db.Decimal(8, 2)
  frequency       String?                               // "E3D" / "EOD" / "ED"
  route           String?                               // "IM" / "SC" / "Oral"
  week_start      Int                                   // 周期内第几周开始
  week_end        Int
  
  cycle           ControlledCycle @relation(fields: [cycle_id], references: [id], onDelete: Cascade)
  
  @@map("controlled_protocol_items")
}

model ControlledDoseLog {
  id              String   @id @default(uuid())
  cycle_id        String?
  user_id         String
  compound        String
  dose_mg         Decimal  @db.Decimal(8, 2)
  route           String?
  injection_site  String?                               // 左臀 / 右肩
  taken_at        DateTime
  log_date        DateTime @db.Date
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  cycle           ControlledCycle? @relation(fields: [cycle_id], references: [id])
  
  @@index([user_id, log_date])
  @@map("controlled_dose_logs")
}

model BloodworkResult {
  id              String   @id @default(uuid())
  user_id         String
  cycle_id        String?
  test_date       DateTime @db.Date
  lab_name        String?
  
  // 常见指标
  total_test_ng_dl     Decimal? @db.Decimal(8, 2)
  free_test_pg_ml      Decimal? @db.Decimal(8, 2)
  estradiol_pg_ml      Decimal? @db.Decimal(8, 2)
  hematocrit_pct       Decimal? @db.Decimal(5, 2)
  hemoglobin_g_dl      Decimal? @db.Decimal(5, 2)
  hdl_mg_dl            Decimal? @db.Decimal(6, 2)
  ldl_mg_dl            Decimal? @db.Decimal(6, 2)
  alt_u_l              Decimal? @db.Decimal(6, 2)
  ast_u_l              Decimal? @db.Decimal(6, 2)
  creatinine_mg_dl     Decimal? @db.Decimal(5, 2)
  blood_pressure_sys   Int?
  blood_pressure_dia   Int?
  
  raw_report_url       String?                          // 完整报告 PDF
  
  client_op_id    String   @unique
  client_ts       DateTime
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deleted_at      DateTime?
  
  cycle           ControlledCycle? @relation(fields: [cycle_id], references: [id])
  
  @@index([user_id, test_date])
  @@map("bloodwork_results")
}
```

### 14.3 权限规则（**修订 R2，解决评审 P0-4 + P0-7**）

> 评审 P0-4 指出"教练拿不到运动员的 PIN，scope.controlled 是死字段"。
> 选定方案：教练访问走**独立的 `ControlledViewToken`**，由运动员单独授予并随时撤销，不复用 PIN。

```text
访问规则：

1. 本人访问（/controlled/*）：
   - 必须 users.controlled_module_enabled = true
   - 必须先 POST /controlled/pin/verify → 拿到 ControlledPinSession（写入 §14.4 表，5 min TTL）
   - 请求头携带 X-Controlled-PIN-Session: <token>
   - 每次访问写 audit_logs

2. 教练访问（/coach/athletes/:id/controlled/view）：
   - 必须 CoachAthleteLink.scope_controlled = true
   - 必须运动员主动签发 ControlledViewToken（一次性按需，含过期 + 可撤销）→ §14.5 表
   - 教练请求头携带 X-Controlled-View-Token: <token>
   - 教练侧默认只看脱敏视图（化合物名 + 剂量，不含注射部位、不含血检 PDF）
   - 每次访问写 audit_logs + 推送通知运动员

3. 导出（/controlled/export/request）：
   - 仅本人；必须 PIN session + 邮件二次确认
   - 加密 ZIP（AES-256），密码独立设定

4. 分享：禁止；所有公共 share / public profile / export(non-controlled) API 都不应返回受控数据
5. 商店分发版本：BUILD_FLAG_DISABLE_CONTROLLED=true 完全 tree-shake 该路由
```

### 14.4 controlled_pin_sessions（本人 PIN 验证后的临时 token）

```prisma
model ControlledPinSession {
  id              String   @id @default(uuid())
  user_id         String
  token_hash      String   @unique                  // SHA-256
  issued_at       DateTime @default(now())
  expires_at      DateTime                          // issued + 5 min
  revoked_at      DateTime?
  fail_attempts   Int      @default(0)              // PIN 暴力破解防御（评审 P1-23）
  locked_until    DateTime?                         // 5 次错误锁 15 分钟
  ip              String?
  user_agent      String?
  
  @@index([user_id, expires_at])
  @@map("controlled_pin_sessions")
}
```

PIN 安全规则（写入 audit_logs + 邮件通知用户）：
- PIN 必须 ≥ 6 位数字
- 连续 5 次错误锁定该用户的 PIN 15 分钟（写 locked_until）
- 每次锁定触发邮件通知 + push（即使用户没开 push 也发邮件）
- 锁定期间所有 /controlled/* 路由 403

### 14.5 controlled_view_tokens（运动员授予教练的脱敏视图 token）

```prisma
model ControlledViewToken {
  id                String   @id @default(uuid())
  athlete_id        String                          // 颁发者（运动员）
  coach_id          String                          // 接收者（教练）
  link_id           String                          // 关联 CoachAthleteLink.id
  token_hash        String   @unique
  scope             ControlledViewScope @default(SUMMARY)  // SUMMARY / FULL
  issued_at         DateTime @default(now())
  expires_at        DateTime                        // 默认 7 天
  revoked_at        DateTime?
  
  @@index([athlete_id, coach_id])
  @@map("controlled_view_tokens")
}

enum ControlledViewScope {
  SUMMARY    // 仅化合物 + 周期阶段 + 周剂量（去除注射时间/部位/血检）
  FULL       // 全部（需运动员明确二次确认才允许）
}
```

### 14.6 应用商店分发策略（修订 R2，评审 P1-27）

> 评审 P1-27 指出 PWA 不通过商店分发也可装到桌面，build flag 无法区分用户来源。
> 选定方案：**双 host + 双构建**。

| 构建 / 部署 | Host | 受控模块 | 适用人群 |
|---|---|---|---|
| 商店包装层（Capacitor / TWA） | `app.fitflow.pro` | `BUILD_FLAG_DISABLE_CONTROLLED=true`，tree-shake 完全移除 | App Store / Play Store 下载用户 |
| 公网 PWA（专业版） | `pro.fitflow.pro` | 启用（默认仍关闭，用户主动开启） | 已认证职业选手 / 教练 邀请制注册 |

- 商店截图、宣传文案、官网首页均不出现 PED 字样
- 两个 host 共享同一后端 API（`/controlled/*` 路由对 `app.fitflow.pro` 来源的请求由网关层 403）
- 注册账号在两个 host 通用，但 controlled_module_enabled 只能在 `pro.fitflow.pro` 上开启
- 商店版本检索 `Controlled` 关键字命中数 = 0（CI 验收门槛）

---

## 15. 迁移策略

由于 v2 是 rewrite 且 v1 没有真实用户：

1. v1 schema 保留在 `prisma/legacy_v1/schema.prisma`（仅作历史参考）
2. v2 全新建库 `fitflow_pro_v2_db`，与 v1 的 `fitflow_db` 并存
3. v2 启动新 migration 链：`prisma/migrations/20260603000000_v2_init/`（修订 R2 评审 P1-17，与 TIMELINE W2 对齐）
4. 应用启动时通过环境变量 `APP_VERSION=v2` 切换 schema 加载

详见 `API_DESIGN_v2.md` §0 的部署小节。

---

## 16. 数据保留与导出

| 数据 | 保留策略 | 导出格式 |
|---|---|---|
| 训练 / 营养 / 体测 | 永久 | JSON / CSV |
| 进度照片 | 永久 + 用户主动删除 | ZIP（含 EXIF 抹除） |
| 受控数据 | 永久 + 独立 PIN 导出 | 加密 ZIP（AES-256） |
| 同步事件 | 90 天后归档 | — |
| 审计日志 | 永久 | — |

---

## 17. 容量预估（单运动员一年）

| 表 | 行数 / 年 | 备注 |
|---|---|---|
| set_entries | ~36,000 | 6 训练/周 × 8 动作 × 4 组 × 52 周 |
| meal_logs | ~2,200 | 6 餐/天 × 365 |
| meal_items | ~6,600 | 平均 3 项/餐 |
| supplement_logs | ~7,300 | 20 次/天 × 365 |
| body_records | ~365 | 每日称重 |
| progress_photos | ~200 | 每周 4 张 |
| expenses | ~600 | 平均 1.5/天 |

单运动员总数据量约 50 MB / 年（不含照片）。1 万运动员 = 500 GB / 年 →
PostgreSQL 单实例可承载，分库放 v3 再考虑。

---

**Last Updated**: 2026-05-27（R2 修订后）  
**Status**: ✅ Ready for Review（R2，含评审 P0 全部修复 + 必修 P1 修复）

---

## 18. R2 修订总览（评审驱动）

本修订对应 `docs/reviews/20260527_v2_docs_initial_r1.md`。修复清单：

### P0（已全部 close）

| ID | 修复位置 |
|---|---|
| P0-1 计划餐缺实体 | §5.4 新增 `MealPlanTemplate / ScheduledMeal / ScheduledMealIngredient` |
| P0-2 CoachComment 多态 FK | §10.4 去掉 `check_in` 关系字段，应用层关联 |
| P0-3 photos 反向关系断 | §7.2 `ProgressPhoto.weekly_check_in_id` + relation("CheckInPhotos") |
| P0-4 教练-PED 流程打架 | §14.3 独立的 `ControlledViewToken` 路径；§14.5 新表 |
| P0-5 "默认值即历史值"无表 | §5.7 新增 `LastValueCache` |
| P0-6 子表缺 client_op_id | §0.1 父子表幂等策略表；多张子表已补字段 |
| P0-7 缺 RefreshToken / PinSession / CoachInvitation | §3.2 §10.3 §14.4 三表新增 |
| P0-8 CONTROLLED 在普通 expenses | §9.1 移除该枚举；新增 `ControlledExpense` 表 |

### P1（必修部分已 close）

P1-9（SetEntry 字段）/ P1-10（trgm 索引）/ P1-11（措辞）/ P1-12（订阅 3 表）/ P1-13（partial unique）/ P1-15（Epley）/ P1-17（迁移命名 20260603）/ P1-18（删 weeks_remaining）/ P1-19（ReminderRule）/ P1-20（PeakProtocolTemplate）/ P1-26（缓存失效矩阵）/ P1-27（双 host 双构建）/ P1-28（is_complete）/ P1-29（JSON 拆列）/ P1-30（XOR 约束）

### Deferred P1（写入 commit 备忘，留待后续 PR）

- **P1-14** 红黄绿规则定义 → 在 API §14.1 修订
- **P1-16** ROI 公式 → 在 API §13 修订
- **P1-21** 教练改训练范围 → 在 PRD §3 Loop C 收口
- **P1-22** /today 返回数组 → 在 API §5.1 修订
- **P1-23** PIN 暴力破解（部分已在 §14.4 完成 fail_attempts / locked_until）→ 剩余在 API §16 完成
- **P1-24** 照片离线上传 → 在 API §10.1 修订
- **P1-25** /users/me/audit-logs → 在 API §17 修订

（以上将在 API_DESIGN_v2.md 的同步修订中完成。）

### Deferred P2

P2-31~P2-40 全部留作下一轮（不阻塞 W2 开工）。
