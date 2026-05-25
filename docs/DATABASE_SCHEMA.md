# FitFlow 数据库设计文档

## 版本信息
- 文档版本：1.0
- 创建日期：2026-05-25
- 状态：设计阶段

## 数据库概述
- **数据库系统**：PostgreSQL
- **ORM**：Prisma
- **时区**：UTC

## 表结构设计

### 1. users（用户表）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  gender ENUM('MALE', 'FEMALE', 'OTHER'),
  age INT,
  height DECIMAL(5, 2),  -- cm
  initial_weight DECIMAL(6, 2),  -- kg
  fitness_goal ENUM('GAIN_MUSCLE', 'LOSE_FAT', 'MAINTENANCE'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
```

### 2. meals（饮食记录表）
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  meal_type ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'),
  food_name VARCHAR(255) NOT NULL,
  description TEXT,
  calories DECIMAL(8, 2),  -- kcal
  protein DECIMAL(6, 2),  -- g
  carbs DECIMAL(6, 2),  -- g
  fat DECIMAL(6, 2),  -- g
  portion_size VARCHAR(100),
  meal_date DATE NOT NULL,
  meal_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. workouts（训练记录表）
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  workout_type ENUM('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'),
  exercise_name VARCHAR(255) NOT NULL,
  duration_minutes INT,  -- 分钟
  calories_burned DECIMAL(8, 2),  -- kcal
  intensity ENUM('LOW', 'MEDIUM', 'HIGH'),
  sets INT,
  reps INT,
  weight DECIMAL(6, 2),  -- kg
  notes TEXT,
  workout_date DATE NOT NULL,
  workout_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. expenses（消费记录表）
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category ENUM('FOOD', 'GYM', 'SUPPLEMENTS', 'EQUIPMENT', 'APPAREL', 'OTHER'),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'CNY',
  description VARCHAR(255),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5. body_records（身体数据表）
```sql
CREATE TABLE body_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  weight DECIMAL(6, 2),  -- kg
  body_fat_percentage DECIMAL(5, 2),  -- %
  muscle_mass DECIMAL(6, 2),  -- kg
  chest DECIMAL(6, 2),  -- cm
  waist DECIMAL(6, 2),  -- cm
  hip DECIMAL(6, 2),  -- cm
  arm DECIMAL(6, 2),  -- cm
  thigh DECIMAL(6, 2),  -- cm
  measurement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 6. daily_summary（日汇总表）
```sql
CREATE TABLE daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  summary_date DATE NOT NULL,
  total_calories INT,
  total_protein DECIMAL(8, 2),
  total_carbs DECIMAL(8, 2),
  total_fat DECIMAL(8, 2),
  total_calories_burned INT,
  workouts_count INT DEFAULT 0,
  meals_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, summary_date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 索引设计
```sql
-- 查询优化索引
CREATE INDEX idx_meals_user_id_date ON meals(user_id, meal_date DESC);
CREATE INDEX idx_workouts_user_id_date ON workouts(user_id, workout_date DESC);
CREATE INDEX idx_expenses_user_id_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_body_records_user_id_date ON body_records(user_id, measurement_date DESC);
CREATE INDEX idx_daily_summary_user_id_date ON daily_summary(user_id, summary_date DESC);
```

## Prisma Schema 代码
参考文件：`backend/prisma/schema.prisma`

## 数据库初始化
- 数据库名称：`fitflow_db`
- 初始化脚本：`scripts/db-init.sql`
- ORM迁移：`backend/prisma/migrations`
