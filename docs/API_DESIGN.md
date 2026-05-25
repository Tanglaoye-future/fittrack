# FitFlow API 设计文档

## 版本信息
- 文档版本：1.0
- 创建日期：2026-05-25
- API版本：v1

## API 概述
- **基础URL**：`http://localhost:3001/api/v1`
- **认证方式**：JWT Bearer Token
- **响应格式**：JSON
- **时区**：UTC

## 通用规范

### 响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 错误响应格式
```json
{
  "code": 400,
  "message": "Error message",
  "errors": []
}
```

### HTTP 状态码
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

## 认证相关 API

### 1. 用户注册
- **路径**：`POST /auth/register`
- **请求体**：
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "securepass123",
  "gender": "MALE",
  "age": 28,
  "height": 180,
  "initial_weight": 75,
  "fitness_goal": "GAIN_MUSCLE"
}
```
- **响应**：返回用户信息和 JWT token

### 2. 用户登录
- **路径**：`POST /auth/login`
- **请求体**：
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```
- **响应**：返回 JWT token

### 3. 刷新 Token
- **路径**：`POST /auth/refresh`
- **请求体**：
```json
{
  "refresh_token": "..."
}
```

## 用户相关 API

### 1. 获取用户信息
- **路径**：`GET /users/profile`
- **认证**：需要
- **响应**：用户完整信息

### 2. 更新用户信息
- **路径**：`PATCH /users/profile`
- **认证**：需要
- **请求体**：用户可编辑字段的子集

### 3. 获取用户统计数据
- **路径**：`GET /users/stats`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`

## 饮食管理 API

### 1. 新增饮食记录
- **路径**：`POST /meals`
- **认证**：需要
- **请求体**：
```json
{
  "meal_type": "BREAKFAST",
  "food_name": "鸡蛋",
  "calories": 155,
  "protein": 13,
  "carbs": 1.1,
  "fat": 11,
  "portion_size": "1个",
  "meal_date": "2026-05-25",
  "meal_time": "08:00:00"
}
```

### 2. 获取饮食记录列表
- **路径**：`GET /meals`
- **认证**：需要
- **查询参数**：`date`, `meal_type`, `page`, `limit`

### 3. 获取单条饮食记录
- **路径**：`GET /meals/:id`
- **认证**：需要

### 4. 更新饮食记录
- **路径**：`PATCH /meals/:id`
- **认证**：需要

### 5. 删除饮食记录
- **路径**：`DELETE /meals/:id`
- **认证**：需要

## 训练管理 API

### 1. 新增训练记录
- **路径**：`POST /workouts`
- **认证**：需要
- **请求体**：
```json
{
  "workout_type": "STRENGTH",
  "exercise_name": "卧推",
  "duration_minutes": 60,
  "calories_burned": 250,
  "intensity": "HIGH",
  "sets": 4,
  "reps": 8,
  "weight": 100,
  "workout_date": "2026-05-25",
  "workout_time": "18:00:00"
}
```

### 2. 获取训练记录列表
- **路径**：`GET /workouts`
- **认证**：需要
- **查询参数**：`date`, `workout_type`, `page`, `limit`

### 3. 更新训练记录
- **路径**：`PATCH /workouts/:id`
- **认证**：需要

### 4. 删除训练记录
- **路径**：`DELETE /workouts/:id`
- **认证**：需要

## 消费管理 API

### 1. 新增消费记录
- **路径**：`POST /expenses`
- **认证**：需要
- **请求体**：
```json
{
  "category": "GYM",
  "amount": 199,
  "currency": "CNY",
  "description": "月会费",
  "expense_date": "2026-05-25"
}
```

### 2. 获取消费记录列表
- **路径**：`GET /expenses`
- **认证**：需要
- **查询参数**：`category`, `start_date`, `end_date`, `page`, `limit`

### 3. 消费统计
- **路径**：`GET /expenses/stats`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`

## 身体数据 API

### 1. 新增身体测量记录
- **路径**：`POST /body-records`
- **认证**：需要
- **请求体**：
```json
{
  "weight": 72.5,
  "body_fat_percentage": 18.5,
  "muscle_mass": 55.2,
  "chest": 100,
  "waist": 85,
  "hip": 95,
  "arm": 35,
  "thigh": 58,
  "measurement_date": "2026-05-25"
}
```

### 2. 获取身体数据列表
- **路径**：`GET /body-records`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`, `page`, `limit`

## 数据分析 API

### 1. 获取每日摘要
- **路径**：`GET /analytics/daily-summary`
- **认证**：需要
- **查询参数**：`date`

### 2. 获取周汇总
- **路径**：`GET /analytics/weekly-summary`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`

### 3. 获取月汇总
- **路径**：`GET /analytics/monthly-summary`
- **认证**：需要
- **查询参数**：`year`, `month`

### 4. 热量趋势
- **路径**：`GET /analytics/calories-trend`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`, `period` (day|week|month)

### 5. 营养分析
- **路径**：`GET /analytics/nutrition-analysis`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`

### 6. 消费分析
- **路径**：`GET /analytics/expense-analysis`
- **认证**：需要
- **查询参数**：`start_date`, `end_date`

## 分页规范
- **page**：默认 1，从 1 开始
- **limit**：默认 20，最大 100
- **响应**：包含 `total`, `page`, `limit`, `data` 字段

## 错误码规范
- `0`: 成功
- `400`: 参数验证错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `409`: 资源冲突
- `500`: 服务器错误

## 限流规范
- 默认：100 req/min per user
- 认证端点：20 req/min per IP
