# FitFlow - 健身饮食消费管理系统

![FitFlow](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-MVP%20Development-orange)

🏋️ 一站式健身数据管理平台 - 整合饮食、训练、消费与数据分析

## 📋 目录
- [项目概览](#项目概览)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [API 文档](#api-文档)
- [开发计划](#开发计划)

## 🎯 项目概览

**FitFlow** 是一款针对健身用户的**一体化数据管理平台**。用户可以在这个平台上：

- 📝 **记录饮食**：轻松记录每日饮食，追踪热量和营养数据
- 💪 **记录训练**：详细记录各类训练计划和成果
- 💰 **管理消费**：统计健身相关消费，了解投入成本
- 📊 **数据分析**：可视化展示长期趋势，发现数据规律
- 📈 **身体数据**：记录体重、围度等身体指标变化

### 用户痛点
❌ 数据分散在多个应用中  
❌ 难以形成完整的分析闭环  
❌ 缺少长期趋势分析  
❌ 无法获得成长反馈  

### 产品愿景
✅ 打造健身用户的**唯一数据中心**  
✅ 提供**智能分析和洞察**  
✅ 支持**数据导出和集成**  

## 🌟 核心功能

### 第一阶段 (MVP)
- [x] **用户系统** - 注册、登录、个人资料
- [x] **饮食管理** - 新增、编辑、统计饮食记录
- [x] **训练管理** - 记录各类训练数据
- [x] **消费管理** - 追踪健身相关消费
- [x] **身体数据** - 记录体测指标
- [x] **数据分析** - 图表展示、趋势分析
- [x] **仪表板** - 每日概览和周汇总

### 计划中的功能
- [ ] **AI 饮食分析** - 基于 AI 的营养建议
- [ ] **OCR 食物识别** - 通过图像识别食物
- [ ] **社区体系** - 用户交流和分享
- [ ] **AI 健身教练** - 个性化训练计划
- [ ] **数据导出** - 支持多种格式导出
- [ ] **离线模式** - 无网络环境支持

## 🛠 技术栈

### 前端
```
Next.js 13+          # React 全栈框架
TypeScript           # 类型安全
Tailwind CSS         # 样式框架
React Query/SWR      # 数据获取
Zustand              # 状态管理
Recharts             # 数据可视化
```

### 后端
```
NestJS               # Node.js 框架
TypeScript           # 类型安全
PostgreSQL           # 数据库
Prisma               # ORM
JWT                  # 身份认证
```

### 基础设施
```
Docker/Docker Compose # 容器化
GitHub Actions        # CI/CD
```

## 🚀 快速开始

### 前置要求
- Node.js 18+
- npm / yarn / pnpm
- Docker & Docker Compose
- Git

### 安装步骤

#### 方法 1: 自动初始化 (推荐)

**Windows (PowerShell):**
```powershell
cd fittrack
.\scripts\init.ps1
```

**Mac/Linux (Bash):**
```bash
cd fittrack
bash scripts/init.sh
```

#### 方法 2: 手动设置

1. **克隆项目**
```bash
git clone <repo-url>
cd fittrack
```

2. **启动 PostgreSQL**
```bash
docker-compose up -d postgres
```

3. **后端设置**
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev
```

4. **前端设置** (新终端)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

5. **访问应用**
- 🌐 前端: http://localhost:3000
- ⚙️ 后端 API: http://localhost:3001/api/v1
- 📚 API 文档: http://localhost:3001/api/docs

## 📁 项目结构

```
fittrack/
├── docs/                          # 项目文档
│   ├── DATABASE_SCHEMA.md         # 数据库设计
│   ├── API_DESIGN.md              # API 规范
│   ├── DEVELOPMENT_STANDARDS.md   # 开发规范
│   ├── PROJECT_TIMELINE.md        # 项目计划
│   └── FitFlow_PRD_V1.docx       # 产品需求文档
│
├── backend/                       # 后端项目
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── auth/                  # 认证模块
│   │   ├── users/                 # 用户模块
│   │   ├── meals/                 # 饮食模块
│   │   ├── workouts/              # 训练模块
│   │   ├── expenses/              # 消费模块
│   │   ├── body-records/          # 身体数据模块
│   │   ├── analytics/             # 数据分析模块
│   │   └── common/                # 公共组件
│   ├── prisma/
│   │   ├── schema.prisma          # 数据库 Schema
│   │   └── migrations/            # 数据库迁移
│   ├── test/                      # 测试文件
│   └── package.json
│
├── frontend/                      # 前端项目
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   ├── components/            # React 组件
│   │   │   ├── common/            # 通用组件
│   │   │   ├── layout/            # 布局组件
│   │   │   └── features/          # 功能组件
│   │   ├── hooks/                 # 自定义 Hooks
│   │   ├── lib/                   # 工具函数
│   │   ├── styles/                # 全局样式
│   │   ├── types/                 # TypeScript 类型
│   │   └── utils/                 # 工具函数
│   ├── public/                    # 静态资源
│   └── package.json
│
├── scripts/                       # 项目脚本
│   ├── init.sh                    # Linux/Mac 初始化脚本
│   ├── init.ps1                   # Windows 初始化脚本
│   └── db-init.sql                # 数据库初始化 SQL
│
├── docker-compose.yml             # Docker 编排配置
├── .gitignore
├── README.md                      # 本文件
└── FitFlow_PRD_V1.docx           # PRD 文档
```

## 📚 开发指南

### 代码规范
详见 [DEVELOPMENT_STANDARDS.md](docs/DEVELOPMENT_STANDARDS.md)

- TypeScript strict mode
- ESLint + Prettier 强制规范
- 函数文档注释
- 单元测试覆盖 ≥ 80%

### 常见命令

**后端:**
```bash
cd backend
npm run start:dev      # 开发服务器 (热重载)
npm run build          # 生产构建
npm test               # 运行测试
npx prisma studio     # 打开数据库 UI
npx prisma migrate dev # 运行迁移
```

**前端:**
```bash
cd frontend
npm run dev            # 开发服务器
npm run build          # 生产构建
npm run lint           # 代码检查
npm run format         # 代码格式化
```

### Git 工作流

1. **新功能分支**
```bash
git checkout -b feat/feature-name
```

2. **提交规范**
```bash
git commit -m "feat(module): 功能描述"
git commit -m "fix(auth): 修复登录问题"
```

3. **推送和 PR**
```bash
git push origin feat/feature-name
# 在 GitHub 创建 Pull Request
```

### 环境变量配置

**后端 (.env)**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fitflow_db
NODE_ENV=development
JWT_SECRET=your-secret-key
PORT=3001
```

**前端 (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=FitFlow
```

## 📖 API 文档

详见 [API_DESIGN.md](docs/API_DESIGN.md)

### 主要端点

```
# 认证
POST   /api/v1/auth/register       # 注册
POST   /api/v1/auth/login          # 登录
POST   /api/v1/auth/refresh        # 刷新 Token

# 饮食
GET    /api/v1/meals               # 获取饮食列表
POST   /api/v1/meals               # 新增饮食
PATCH  /api/v1/meals/:id           # 更新饮食
DELETE /api/v1/meals/:id           # 删除饮食

# 训练
GET    /api/v1/workouts            # 获取训练列表
POST   /api/v1/workouts            # 新增训练
PATCH  /api/v1/workouts/:id        # 更新训练
DELETE /api/v1/workouts/:id        # 删除训练

# 数据分析
GET    /api/v1/analytics/daily-summary
GET    /api/v1/analytics/weekly-summary
GET    /api/v1/analytics/monthly-summary
GET    /api/v1/analytics/calories-trend
GET    /api/v1/analytics/nutrition-analysis
```

## 📅 开发计划

详见 [PROJECT_TIMELINE.md](docs/PROJECT_TIMELINE.md)

| 阶段 | 时间 | 目标 |
|------|------|------|
| 🔴 基础设施 | 第 1-2 周 | 项目框架、数据库设计 |
| 🟠 后端开发 | 第 3-4 周 | 完整 API 实现 |
| 🟡 前端开发 | 第 5-6 周 | 所有页面实现 |
| 🟢 集成优化 | 第 7 周 | 联调、性能优化 |
| 🔵 上线上线 | 第 8 周 | 文档、部署、上线 |

## 🧪 测试

```bash
# 后端单元测试
cd backend
npm test

# 前端单元测试
cd frontend
npm test

# 集成测试
npm run test:e2e
```

## 📊 数据库

### 初始化
```bash
npx prisma migrate dev --name init
```

### 数据库设计文档
详见 [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

### 主要表
- `users` - 用户表
- `meals` - 饮食记录
- `workouts` - 训练记录
- `expenses` - 消费记录
- `body_records` - 身体数据
- `daily_summary` - 每日汇总

## 🚢 部署

### Docker 部署
```bash
docker-compose up -d
```

### 生产环境
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🐛 问题反馈

发现 Bug 或有建议？

1. 检查 [Issues](../../issues)
2. 创建新 Issue，包含：
   - 问题描述
   - 重现步骤
   - 预期行为
   - 实际行为
   - 环境信息

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 👥 贡献者

<a href="../../graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yourorg/fitflow" />
</a>

## 📞 联系方式

- 📧 Email: support@fitflow.com
- 💬 Discord: [加入社区](https://discord.gg/fitflow)
- 🐦 Twitter: [@FitFlowApp](https://twitter.com/FitFlowApp)

---

**Made with ❤️ by FitFlow Team**

Last Updated: 2026-05-25 | Version: 1.0.0
