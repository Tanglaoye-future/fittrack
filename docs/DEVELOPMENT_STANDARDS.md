# FitFlow 开发规范

## 版本信息
- 文档版本：1.0
- 创建日期：2026-05-25

## 代码风格规范

### TypeScript 规范
- 使用 ESLint + Prettier 进行代码检查和格式化
- 每个文件最多 500 行代码
- 函数最多 50 行代码
- 必须使用类型注解

```typescript
// ✅ 好的示例
interface User {
  id: string;
  email: string;
  username: string;
}

async function getUserById(id: string): Promise<User> {
  // ...
}

// ❌ 避免
function getUser(id) {
  // ...
}
```

### 命名规范
- **文件名**：kebab-case（例：`user-service.ts`）
- **类名**：PascalCase（例：`UserService`）
- **函数名**：camelCase（例：`getUserById`）
- **常量**：UPPER_SNAKE_CASE（例：`MAX_RETRY_COUNT`）
- **私有变量**：前缀 `_`（例：`_internalState`）

### 注释规范
```typescript
/**
 * 获取用户信息
 * @param userId - 用户ID
 * @returns 用户对象
 * @throws 当用户不存在时抛出错误
 */
async function getUser(userId: string): Promise<User> {
  // ...
}
```

## 前端规范

### 目录结构
```
frontend/
├── src/
│   ├── app/              # Next.js 13+ App Router
│   ├── components/       # 可复用组件
│   │   ├── common/      # 通用组件
│   │   ├── layout/      # 布局组件
│   │   └── features/    # 功能组件
│   ├── hooks/           # 自定义hooks
│   ├── lib/             # 工具函数
│   ├── styles/          # 全局样式
│   ├── types/           # TypeScript类型定义
│   └── utils/           # 工具函数
├── public/              # 静态资源
└── .env.local          # 环境变量
```

### 组件规范
```typescript
// ✅ 好的示例 - 函数组件
interface MealCardProps {
  mealId: string;
  calories: number;
  onDelete?: (id: string) => void;
}

export function MealCard({ mealId, calories, onDelete }: MealCardProps) {
  return (
    <div className="...">
      {/* 组件内容 */}
    </div>
  );
}
```

### Tailwind CSS 使用
- 使用 Tailwind 的 utility classes
- 避免自定义 CSS，优先考虑组合 Tailwind 类
- 使用 `@apply` 处理重复的样式组合

### API 调用规范
- 使用 `fetch` 或 `axios`
- 创建 API 层文件（`lib/api/`）
- 统一处理错误和拦截器

```typescript
// lib/api/client.ts
export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    // 错误处理
    return response.json();
  }
};
```

## 后端规范

### 目录结构
```
backend/
├── src/
│   ├── app.module.ts           # 主模块
│   ├── main.ts                 # 应用入口
│   ├── auth/                   # 认证模块
│   ├── users/                  # 用户模块
│   ├── meals/                  # 饮食模块
│   ├── workouts/               # 训练模块
│   ├── expenses/               # 消费模块
│   ├── analytics/              # 数据分析模块
│   ├── common/
│   │   ├── decorators/        # 自定义装饰器
│   │   ├── filters/           # 异常过滤器
│   │   ├── guards/            # 守卫
│   │   ├── interceptors/      # 拦截器
│   │   ├── middleware/        # 中间件
│   │   └── pipes/             # 管道
│   ├── database/              # 数据库配置
│   └── config/                # 配置文件
├── prisma/
│   ├── schema.prisma          # Prisma Schema
│   └── migrations/            # 数据库迁移
├── test/                      # 测试文件
└── .env.example               # 环境变量示例
```

### NestJS 模块结构
```
src/users/
├── users.controller.ts        # 控制器
├── users.service.ts           # 业务逻辑
├── users.module.ts            # 模块定义
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   └── user.entity.ts
└── __tests__/
    ├── users.controller.spec.ts
    └── users.service.spec.ts
```

### 错误处理
```typescript
// ✅ 统一使用自定义异常
import { HttpException, HttpStatus } from '@nestjs/common';

throw new HttpException(
  'User not found',
  HttpStatus.NOT_FOUND,
);
```

### 数据库交互
- 使用 Prisma Client
- 每个模块独立管理自己的数据库操作
- 使用 Service 层封装业务逻辑

```typescript
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
```

## Git 提交规范

### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码风格调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具、依赖更新

### Commit 示例
```
feat(meals): 添加饮食记录功能

- 实现新增饮食记录API
- 添加饮食记录验证
- 创建前端饮食输入表单

Closes #123
```

## 测试规范

### 单元测试
- 覆盖率目标：80%
- 使用 Jest 框架
- 每个函数都应有测试用例

### 集成测试
- 测试 API 端点完整流程
- 使用 Supertest 测试 HTTP 请求

### 测试文件命名
```
文件: user.service.ts
测试: user.service.spec.ts
```

## 代码审查规范
- 至少一名同事审查
- 检查点：
  - 代码风格一致性
  - 类型安全性
  - 错误处理完整性
  - 性能影响
  - 测试覆盖
  - 文档完善性

## 性能规范
- API 响应时间：< 500ms
- 首屏加载时间：< 3s
- 数据库查询：使用索引
- 前端包大小：主包 < 300KB

## 安全规范
- SQL 注入防护：使用参数化查询
- XSS 防护：React 自动转义 + CSP
- CSRF 防护：使用 CSRF tokens
- 密码：bcrypt 哈希 + salt
- 敏感信息：不记录密码等敏感字段
- API 限流：已在 API 设计中定义
