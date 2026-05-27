# FitFlow Pro v2 — 12 周交付计划

**文档版本**: 2.0  
**创建日期**: 2026-05-27  
**周期**: 12 周（W1 – W12）  
**团队建议**: 8 人（详见 §3）  
**替代文档**: 本文档完全替代 `PROJECT_TIMELINE.md`（v1 已停止开发）

---

## 0. 与 v1 的关系

| 项 | 处置 |
|---|---|
| `docs/PROJECT_TIMELINE.md`（v1，8 周计划） | **已废弃**，本文档替代 |
| v1 后端代码（`backend/src/*`） | W2 中由 `prisma schema_v2` 引导彻底重写 |
| v1 前端代码（`frontend/src/*`） | W3 起按新 UX 设计重做 |
| v1 已有的 Docker / 工程配置 | 保留并升级 |
| v1 文档（PRD/API/SCHEMA） | 移入 `docs/legacy_v1/` 作历史归档 |

> 决策来源：用户在 v2 规划评审中已确认 `scope = rewrite`（v1 数据模型完全推倒重写）。

---

## 1. 总览（12 周里程碑）

```
W1   定位冻结 + UX 原型
W2   数据模型 v2（Prisma schema_v2 + 迁移）
W3   训练域 Day-1（Exercise库 + Plan + Template）
W4   训练域 Day-2（Session/Set + Loop A 跑通）
W5   营养域 Day-1（Food库 + Recipe + Macro 反算）
W6   营养域 Day-2（Meal + Quick-log + Loop B 跑通）
W7   体测 + 消费域（含照片上传 + ROI 报表）
W8   备赛域（Competition + PrepCycle + 自动 macros）
W9   教练域（Coach 看板 + Check-in + Loop C 跑通）
W10  分析与受控模块（Analytics v2 + PED 私域）
W11  PWA 离线 + Push + 集成回归
W12  灰度上线（5 名种子选手） + 文档
```

---

## 2. 北极星 & 验收门槛（每周必须达标）

| 指标 | 达标线 |
|---|---|
| 单组训练录入耗时中位数 | ≤ 5s（W4 起每周自动测） |
| 单餐打卡耗时中位数 | ≤ 8s（W6 起每周自动测） |
| 周 Check-in 填写时间 | ≤ 5min（W9 起每周抽测） |
| API p95 延迟 | < 300ms（W2 起持续监控） |
| 离线状态核心打卡可用 | 100%（W11 起持续监控） |
| PR 通过 UX Checklist 比例 | 100%（W2 起全程） |

> UX Checklist 见 `UX_PRINCIPLES.md` §9。

---

## 3. 团队配置建议（8 人）

| 角色 | 人数 | 主要职责 |
|---|---|---|
| 产品 / 项目经理 | 1 | PRD 维护、种子用户访谈、上线节奏 |
| 后端 Tech Lead | 1 | 架构、Prisma schema、教练 / PED 权限 |
| 后端工程师 | 2 | 训练域 + 营养域 + 备赛域 API |
| 前端 Tech Lead | 1 | PWA 架构、离线同步、组件库 |
| 前端工程师 | 2 | 各页面 + Loop A/B/C 落地 |
| QA + UX 测试 | 1 | 每周健身房用户测试 + 自动化打卡耗时测试 |

可压到 5 人（PM + 1 后端 + 1 前端 + 1 全栈 + 1 QA），周期需延至 16 周。

---

## 4. 每周详细计划

### W1 — 定位冻结 + UX 原型

**目标**：所有人对 v2 是什么、为谁做、怎么做形成统一理解。

| 任务 | 负责 | 交付 |
|---|---|---|
| PRD_v2 评审与签字 | PM | PRD_v2.md v2.0 签字版 |
| UX_PRINCIPLES 全员宣讲 | PM + UX | 全员签字 |
| Figma 原型：主页 + 训练 + 饮食 + check-in（4 屏） | UX | 可点击原型 |
| 5 名职业选手 1:1 访谈（验证模块全景） | PM | 访谈纪要 |
| 12 周排期 + 风险登记 | PM | 本文件 v2.0 |
| 项目改名 → "FitFlow Pro" | 全员 | README 更新（W12） |

**门槛**：5 名选手访谈结论 ≥ 4 名认可"愿意付费试用"。

---

### W2 — 数据模型 v2

**目标**：把 SCHEMA_v2 落到 Prisma + 迁移 + 全模块骨架代码。

| 任务 | 负责 | 交付 |
|---|---|---|
| `prisma/schema.prisma` v2 重写（按 SCHEMA_v2.md R2） | 后端 Lead | schema 通过评审 |
| Migration `20260603000000_v2_init`（评审 P1-17 已对齐 SCHEMA §15） | 后端 Lead | 本地 + Staging 跑通 |
| 启用 `pg_trgm` 扩展并验证中文搜索（评审 P1-10） | 后端 Lead | 200ms 内 1000 食材模糊匹配 |
| 后端 15 个模块空骨架（controller + service + module） | 后端工程师 | `nest start` 通过 |
| Pre-导入 1000 条食材库（中国营养学会） | 后端工程师 | foods 表 ≥ 1000 |
| Pre-导入 200 个常用动作（含视频 URL） | 后端工程师 | exercises 表 ≥ 200 |
| API base + 中间件（JWT / 幂等 / 审计） | 后端 Lead | Swagger 可访问 |
| 前端 PWA 框架（Next.js 14 + Service Worker） | 前端 Lead | Lighthouse PWA ≥ 90 |
| 前端 API SDK（自动生成 + 类型同步） | 前端 Lead | 类型完整 |

**门槛**：后端 `npm run start:dev` 启动 0 报错；前端 `next build` 0 报错；Swagger 可见 15 个模块。

---

### W3 — 训练域 Day-1

**目标**：动作库 + 训练计划 + 模板（Exercise / TrainingPlan / TemplateExercise）。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/exercises` 全部端点 | 后端 1 | 含搜索 / 收藏 / 历史使用 |
| `/training-plans` 全部端点 | 后端 1 | 含嵌套写入、克隆 |
| 前端：动作库搜索页 | 前端 1 | 主流 200 动作可秒搜 |
| 前端：训练计划列表 + 详情 + 模板编辑 | 前端 1 | 可一次性建好 8 周计划 |
| 单元测试 ≥ 80% 覆盖 | 后端 1 | CI 通过 |

**门槛**：能创建"Prep W1-8 推拉腿"完整计划。

---

### W4 — 训练域 Day-2（Loop A 跑通）

**目标**：从打开 App 到完成一次训练全流程跑通，单组 ≤ 5s。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/workouts/sessions/start` 含预填上次数据 | 后端 1 | 接口含 suggested_sets |
| `/workouts/sessions/:sid/exercises/:eid/sets` POST + 批量 | 后端 1 | 幂等键测试通过 |
| PR 自动检测触发器 | 后端 1 | 创建 set 时自动更新 PersonalRecord |
| 前端：训练日主页 | 前端 1 | 一屏看完今日训练 |
| 前端：训练页（每组 ≤ 3 click 完成） | 前端 1 | 真实健身房测试达标 |
| 前端：组间倒计时 | 前端 1 | 振动 + 通知 |
| **健身房真人测试 5 人** | QA | 单组耗时 ≤ 5s 达标 |

**门槛 ★**：5 人健身房测试，单组录入中位耗时 ≤ 5s。**不达标本周不收尾。**

---

### W5 — 营养域 Day-1

**目标**：食材库 + 配方 + macros 反算。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/foods` 全部端点 + 中文全文搜索 | 后端 2 | 200ms 内搜索响应 |
| `/recipes` 全部端点（含 macros 缓存） | 后端 2 | 写入时自动反算并缓存 |
| 条码扫描 endpoint（接入第三方） | 后端 2 | 至少 5000 SKU 覆盖 |
| 前端：食材搜索 + 收藏 | 前端 2 | 含最近用过、官方/我的过滤 |
| 前端：配方编辑器 | 前端 2 | 可见时反算 macros |
| MacroTarget API | 后端 2 | 支持手动 / Coach / 自动来源 |

**门槛**：能从食材库建好 5 份配方，全部反算正确。

---

### W6 — 营养域 Day-2（Loop B 跑通）

**目标**：饮食日打卡 ≤ 8s（计划餐 1 click）。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/meals/today` 整合（含 target / 已达成） | 后端 2 | 单接口出齐主页饮食卡数据 |
| `/meals/quick-log` 一键打卡 | 后端 2 | 含幂等保护 |
| 水分 / 电解质 endpoint | 后端 2 | 含日聚合 |
| 前端：饮食日主页（4 macros 环 + 餐次时间线） | 前端 2 | 一屏看完一日 |
| 前端：自由餐打卡（食材搜索 + 克数微调） | 前端 2 | ≤ 4 click 完成 |
| 前端：训练前 30 分钟提醒 | 前端 1 | 本地通知 + 内容 |
| **健身房真人测试 5 人** | QA | 一餐打卡 ≤ 8s 达标 |

**门槛 ★**：一餐计划餐打卡 1 click；自由餐 ≤ 8s。

---

### W7 — 体测 + 消费

**目标**：照片上传 + 消费 + 预算 + ROI 报表全部跑通。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/body-records` + 趋势 | 后端 1 | 围度 / 体脂 / 主观条件全字段 |
| `/photos/upload-url` 预签名 + 缩略图生成 | 后端 1 | 接入对象存储（OSS / S3） |
| 前端：体测页 + 4 角度照片上传 | 前端 1 | 单次 < 30s 完成本周称重+照片 |
| `/expenses` + 12 类 + ROI | 后端 2 | ROI = 补剂支出 / 净增肌 kg |
| `/budgets` + 循环账单 | 后端 2 | 月初自动展开 RecurringExpense |
| 前端：消费列表 + 月预算环 + ROI 卡片 | 前端 2 | 主页一屏看完本月 |

**门槛**：从 4 张照片上传到生成对比页 < 60s。

---

### W8 — 备赛域

**目标**：备赛周期 + PhaseConfig + 自动 macros 推算。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/competitions` + `/prep-cycles` + `/phases` | 后端 1 | 含 auto-generate-phases |
| 自动 macros 算法（基于体重 + 阶段 + 周次） | 后端 1 | 含单元测试 |
| 每日定时任务：写当日 `MacroTarget`（来源 = AUTO_PREP） | 后端 1 | 凌晨 03:00 用户本地时区跑（`weeks_remaining` 改为运行时算，详见 SCHEMA §8.2 R2 修订） |
| PEAK week 自动激活（剩 7 天）：写 `PrepCycle.current_phase=PEAK_WEEK` + 触发 PeakProtocolTemplate | 后端 1 | 含 ReminderRule PEAK_WEEK_T_MINUS_7 推送 |
| 前端：备赛设置向导（4 步） | 前端 1 | 5 分钟内可建好 16 周备赛 |
| 前端：主页备赛倒数卡 + 阶段标签 | 前端 1 | 醒目可见 |
| Peak week 协议模板（含水钠操作建议） | PM | 内置 |

**门槛**：建一个 16 周备赛，系统自动生成 16 周 macros 表无错。

---

### W9 — 教练域（Loop C 跑通）

**目标**：教练 - 学员协同 + Check-in 表单 + 下发调整。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/coach/dashboard` 学员看板 | 后端 1 | 一屏看完 25 名学员状态 |
| `/coach-links` 邀请 + scope 管理 | 后端 1 | 模块级权限（scope_* booleans）通过测试，partial unique 阻止双教练 |
| `/check-ins` 含 draft 预填 | 后端 1 | 周日自动通知 |
| `/coach/adjustments` 下发 → 自动写新 MacroTarget | 后端 1 | 含审计日志 |
| 前端：教练看板（红黄绿 + 一键回复模板） | 前端 1 | 单学员评注 ≤ 8min |
| 前端：运动员 check-in 表单（预填 + 拍照） | 前端 2 | ≤ 5min 完成 |
| 推送：教练回复 / 学员提交 | 全栈 | PWA Push 跑通 |

**门槛 ★**：1 教练带 5 个学员完整跑完一周 check-in 流程。

---

### W10 — 分析 + 受控模块（PED）

**目标**：Analytics 报表 + 受控物质私域。

| 任务 | 负责 | 交付 |
|---|---|---|
| `/analytics/*` 全部 | 后端 2 | 力量 / 体重 / Macro / 备赛对比 |
| 前端：Analytics 页（4 个核心图） | 前端 2 | 图表加载 < 800ms |
| 受控模块入口（设置中的开关 + 免责声明） | 全栈 | 默认关闭 |
| PIN 验证 + session token | 后端 1 | 5 分钟有效 |
| `/controlled/*` 全部 endpoint | 后端 1 | 含审计 + 加密导出 |
| 前端：受控周期 / 注射 / 血检页 | 前端 1 | 单独导航分支，主页隐藏 |
| **构建分支**：商店版 build flag 完全去除受控代码 | 全栈 | tree-shake 验证 |

**门槛**：商店版包检索 `Controlled` 关键字命中数 = 0。

---

### W11 — PWA 离线 + Push + 集成回归

**目标**：所有打卡功能 100% 支持断网，并完整通过回归测试。

| 任务 | 负责 | 交付 |
|---|---|---|
| Service Worker + IndexedDB 同步队列 | 前端 Lead | 断网 30min 后联网 100% 同步 |
| 客户端 op 队列幂等回放 | 全栈 | 断电再开机数据不丢 |
| `/system/sync/replay` 聚合 endpoint | 后端 Lead | 单次同步 ≥ 100 op |
| 完整 E2E 回归（Cypress） | QA | 30 条核心路径 |
| 跨浏览器测试（Safari iOS / Chrome Android） | QA | 3 设备全部通过 |
| 性能回归：PWA Validator pass + Core Web Vitals（LCP < 2.5s / CLS < 0.1 / INP < 200ms）（修订 R2 评审 P2-31，Lighthouse PWA 分类已废） | 前端 Lead | 报告归档 |
| 真实健身房 4 小时压测（5 用户并发记 200 组） | QA | 0 数据丢失 |

**门槛 ★**：断网 30 分钟内的 100 笔打卡，联网后 100% 同步成功。

---

### W12 — 灰度上线 + 文档 + 5 名种子选手

**目标**：5 名职业选手免费 Pro 终身，签字确认开始用。

| 任务 | 负责 | 交付 |
|---|---|---|
| 生产环境部署（数据库 / API / CDN） | 后端 Lead | health check 全绿 |
| 监控告警（Sentry / Uptime） | 后端 Lead | 报警通道通畅 |
| 用户手册 + 教练手册 | PM | PDF + 在线 |
| 5 名种子选手 onboarding（1:1 演示） | PM + UX | 5 名签字 |
| README.md / 官网 / 商店截图（受控模块禁用） | PM | 全部上线 |
| 灰度配额：注册码 100 个 | 后端 Lead | 邀请制 |
| 上线复盘会 | 全员 | 复盘文档 |

**门槛**：5 名种子选手在 W12 末连续使用 ≥ 3 天且每日 ≥ 6 餐 + 1 训练记录完整。

---

## 5. 关键路径与并行依赖

```
W1 PRD ──→ W2 Schema ──→ W3 训练 ──→ W4 训练Loop A ──┐
                       └→ W5 营养 ──→ W6 营养Loop B ──┤
                                                       ├→ W8 备赛 ──→ W9 教练Loop C ─┐
                       └→ W7 体测+消费 ────────────────┘                              ├→ W11 PWA → W12 上线
                                                       W10 分析+PED ───────────────┘
```

并行机会：W5–W7 三个模块同时开（不同人）。

---

## 6. 风险登记 & 对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| W4 训练 Loop A 5s 不达标 | 中 | 高 | 早 W3 周中做一次小规模真人测；不达标砍其他模块换工时 |
| W6 食材搜索响应慢 | 中 | 中 | W2 提前建好 `gin` 中文全文索引 |
| W10 PED 模块法律咨询延迟 | 中 | 高 | W1 启动法律 review 流程（PM 负责） |
| W11 PWA 在 iOS Safari 离线异常 | 中 | 高 | W2 起持续在 iOS Safari 上跑 smoke test |
| 5 名种子选手不肯用 | 低 | 高 | W1 访谈时即承诺；备选名单准备 10 名 |
| 教练端商业化 ARPU 测算不准 | 低 | 中 | 早期不收教练费，验证 NPS 再调价 |

---

## 7. 每周固定节奏

| 时间 | 仪式 | 时长 |
|---|---|---|
| 周一 10:00 | 周计划会 | 15 min |
| 每天 09:30 | 站会 | 10 min |
| 周三 14:00 | 设计 / 架构评审 | 30 min |
| 周四 16:00 | 真人测试日（W3 起每周必须） | 60 min |
| 周五 16:00 | 周复盘 + Demo | 30 min |
| 周五 17:00 | UX Checklist 抽查（随机 PR） | 30 min |

---

## 8. 上线后的事（v2.x roadmap，仅占位）

- **v2.1**：WebSocket 实时（教练-学员对话）、AI 食物图像识别
- **v2.2**：智能秤 / 心率带 / Apple Health / 微信运动 集成
- **v2.3**：教练端 SaaS 计费 + 学员席位
- **v3.0**：React Native 原生 App + 国际化

---

## 9. 成功定义

✅ W12 末上线  
✅ 5 名种子选手连续使用 ≥ 3 天  
✅ PWA Validator pass + LCP < 2.5s / CLS < 0.1 / INP < 200ms  
✅ 单组打卡 ≤ 5s、单餐打卡 ≤ 8s  
✅ 离线 100% 可用、同步 ≥ 99.9%  
✅ 0 P0 / P1 Bug  
✅ 受控模块在商店版被完全 tree-shake（商店版构建产物检索 `Controlled` 命中 = 0）

---

**Last Updated**: 2026-05-27  
**Status**: ✅ Ready for Sign-off
