# FitFlow Pro — 职业健美运动员专业软件

![FitFlow Pro](https://img.shields.io/badge/Version-2.0.0--planning-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-v2%20Planning-orange)

> **为职业健美运动员打造的"备赛操作系统" —— 把训练、饮食、消费、备赛周期、教练协同的全部数据，收敛在一个低认知负荷的入口中。**

---

## ⚠️ 项目状态（请先读）

本仓库正处于 **v1 → v2 重构** 阶段。

- **v1（FitFlow 通用版，已停止开发）**：通用健身用户的 8 周 MVP；脚手架代码仍在 `backend/` `frontend/`，仅作历史参考。
- **v2（FitFlow Pro 专业版，进行中）**：定位变更为**职业健美运动员专业软件**，12 周交付。**所有新工作请按 v2 文档进行**。

### 📘 v2 核心文档（必读）

| 文档 | 内容 |
|---|---|
| [PRD_v2.md](docs/PRD_v2.md) | 产品定位、用户画像、3 个核心 Loop、模块全景、商业模式 |
| [UX_PRINCIPLES.md](docs/UX_PRINCIPLES.md) | **强约束**：7 条认知负荷准则 + PR 验收 checklist |
| [DATABASE_SCHEMA_v2.md](docs/DATABASE_SCHEMA_v2.md) | 完整数据模型（含训练三层、营养食材库、备赛周期、教练协同、PED 私域、离线幂等键） |
| [API_DESIGN_v2.md](docs/API_DESIGN_v2.md) | 15 个模块的完整接口契约 + 权限矩阵 + 错误码 |
| [PROJECT_TIMELINE_v2.md](docs/PROJECT_TIMELINE_v2.md) | 12 周交付计划 + 每周门槛 |

### 🗂 v1 历史文档（仅供参考，不再维护）

`docs/DATABASE_SCHEMA.md` / `docs/API_DESIGN.md` / `docs/PROJECT_TIMELINE.md` / `docs/PROJECT_STARTUP_REPORT.md` / `docs/INITIALIZATION_CHECKLIST.md` / `docs/DEVELOPMENT_STANDARDS.md` / `FitFlow_PRD_V1.docx`

---

## 🎯 v2 产品概览

### 一句话

**FitFlow Pro 是面向职业健美运动员和健美教练的专业 PWA，目标是把备赛期间数百个微小决策的认知负荷降到最低。**

### 核心用户

- 🥇 **职业健美运动员**：备赛 16-20 周，每天 6 餐 + 1-2 训练 + 20+ 次补剂打卡
- 🏆 **健美教练**：同时带 8-25 名学员，每周日批量看 check-in
- 🥈 **高级业余选手**：无专职教练，靠产品当半个教练

### 与 v1 的根本差异

| 维度 | v1 通用版 | **v2 专业版** |
|---|---|---|
| 目标用户 | 普通健身爱好者 | 职业健美运动员 + 教练 |
| 训练颗粒度 | 一条记录 = 一个动作 | 训练日 → 动作 → 单组（含 RIR/RPE/Tempo） |
| 饮食颗粒度 | 自填食物名 + 估算热量 | 食材称重（g）+ 配方 + macros 自动反算 |
| 消费颗粒度 | 6 个泛分类 | 12 个健美专属分类 + 月度预算 + ROI |
| 备赛能力 | 无 | 5 阶段周期 + 自动 macros / cardio 推算 |
| 教练协同 | 无 | 多对多 + 每周 check-in + 调整下发 |
| 客户端 | Web | **Next.js PWA（离线优先 + 可装桌面）** |
| 商业模式 | 免费 + 高级功能付费 | 运动员订阅 + 教练 SaaS 多席位 |

完整设计理由见 [PRD_v2.md](docs/PRD_v2.md)。

## 🌟 v2 模块全景（15 个模块）

```
账户域:   Auth · Users
训练域:   Exercises · TrainingPlans · Workouts (Session → Exercise → Set)
营养域:   Foods · Recipes · Meals · Supplements
体测域:   BodyRecords · ProgressPhotos
备赛域:   Competitions · CheckIns
消费域:   Expenses (12 类 + 预算 + ROI)
教练域:   Coach (多对多 + 字段级权限)
私域:     Controlled (PED 模块，默认关闭，商店版 tree-shake)
```

详细模块 / 字段 / 接口见 [DATABASE_SCHEMA_v2.md](docs/DATABASE_SCHEMA_v2.md) 与 [API_DESIGN_v2.md](docs/API_DESIGN_v2.md)。

## 🔑 三个核心闭环（Loop）

- **Loop A — 训练日**：开始训练 → 默认值预填 → 单组 ≤ 3 click ≤ 5s 完成 → 自动倒计时
- **Loop B — 饮食日**：计划餐 1 click 打卡；自由餐 ≤ 8s；macros 系统反算（零数学）
- **Loop C — 周 Check-in**：周日预填 → 拍 4 角度照 → 教练 24h 回复 → 系统自动重排下周餐

## 🛠 v2 技术栈

### 前端（PWA 优先）
```
Next.js 14 (App Router)   # React 全栈框架
TypeScript (strict)
Tailwind CSS
TanStack Query            # 数据获取
Zustand                   # 状态管理
IndexedDB (Dexie)         # 离线存储
Service Worker            # 离线 + Push
Recharts                  # 图表
```

### 后端
```
NestJS 10
TypeScript (strict)
PostgreSQL 16
Prisma 5
JWT (access 30min / refresh 30d)
Pino logger
```

### 基础设施
```
Docker / Docker Compose
对象存储 (OSS / S3)        # 照片、PED 加密导出
GitHub Actions             # CI/CD
Sentry + Uptime            # 监控告警
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

## 📁 项目结构（v2 目标态）

```
fittrack/
├── docs/
│   ├── PRD_v2.md                  ★ v2 产品定位（必读）
│   ├── UX_PRINCIPLES.md           ★ v2 认知负荷宪法（必读）
│   ├── DATABASE_SCHEMA_v2.md      ★ v2 数据模型
│   ├── API_DESIGN_v2.md           ★ v2 接口契约
│   ├── PROJECT_TIMELINE_v2.md     ★ v2 12 周计划
│   └── legacy_v1/                 (v1 文档归档，仅参考)
│
├── backend/                       # NestJS
│   ├── src/
│   │   ├── auth/  users/
│   │   ├── exercises/             # ← W3 新增
│   │   ├── training-plans/        # ← W3 新增
│   │   ├── workouts/              # ← W4 重写（Session / Set 三层）
│   │   ├── foods/                 # ← W5 新增
│   │   ├── recipes/               # ← W5 新增
│   │   ├── meals/                 # ← W6 重写
│   │   ├── supplements/           # ← W6 新增
│   │   ├── body-records/          # ← W7 升级
│   │   ├── photos/                # ← W7 新增
│   │   ├── expenses/              # ← W7 升级（12 类 + ROI）
│   │   ├── competitions/          # ← W8 新增
│   │   ├── check-ins/             # ← W9 新增（Loop C）
│   │   ├── coach/                 # ← W9 新增
│   │   ├── analytics/             # ← W10 升级
│   │   ├── controlled/            # ← W10 新增（PED 私域，build flag 可移除）
│   │   ├── system/                # ← W11 离线同步
│   │   └── common/
│   └── prisma/schema.prisma       # ← W2 完全重写
│
├── frontend/                      # Next.js 14 PWA
│   └── src/
│       ├── app/                   # ← W3 起按 v2 UX 重做
│       ├── components/
│       ├── lib/sync/              # ← W11 离线同步层
│       └── lib/offline-db/        # ← W11 IndexedDB
│
├── scripts/
├── docker-compose.yml
├── README.md
└── FitFlow_PRD_V1.docx           (已废弃，待移入 docs/legacy_v1/)
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

## 📅 v2 开发计划（12 周）

详见 [PROJECT_TIMELINE_v2.md](docs/PROJECT_TIMELINE_v2.md)

| 周 | 阶段 | 关键产出 |
|---|---|---|
| W1  | 定位冻结 + UX 原型 | PRD 签字、Figma 原型、5 名选手访谈 |
| W2  | 数据模型 v2 | Prisma schema 重写 + 15 模块骨架 |
| W3–W4 | 训练域（**Loop A**） | 单组打卡 ≤ 5s（健身房真人测试达标） |
| W5–W6 | 营养域（**Loop B**） | 计划餐 1 click、自由餐 ≤ 8s |
| W7  | 体测 + 消费 | 照片上传、ROI 报表 |
| W8  | 备赛域 | 16 周备赛自动 macros |
| W9  | 教练域（**Loop C**） | 1 教练 5 学员完整 check-in 流程 |
| W10 | 分析 + PED 受控模块 | 商店版 tree-shake 验证 |
| W11 | PWA 离线 + Push | 断网 30min 后 100% 同步 |
| W12 | 灰度上线 | 5 名职业选手种子使用 |

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

**Built for professional bodybuilders — by FitFlow Pro Team**

Last Updated: 2026-05-27 | Version: 2.0.0-planning
