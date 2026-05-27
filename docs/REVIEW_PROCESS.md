# FitFlow Pro — 自动评审流程（Review Process）

**文档版本**: 1.0  
**创建日期**: 2026-05-27  
**性质**: 强约束。由 `.cursor/rules/auto-review.mdc` 引用。

---

## 0. 为什么要有这个流程

人类来不及对每一份 AI 生成的文档/代码做严格评审。
但 AI 生成的内容容易有：

- 文档之间的命名/字段/枚举不一致
- 提到但没定义的概念
- 看似可行但实际无法落地的设计
- 违反项目特定准则（如 UX_PRINCIPLES）的细节

所以我们让另一个独立的 AI（Reviewer 子代理）自动评审，
把 P0/P1 问题挑出来 → 自动修复 → 才允许入库。

**用户不需要主动启动评审，AI 生成完代码/文档后会自动执行。**

---

## 1. 触发条件

下列情况自动启动评审，**不询问用户**：

| 触发 | 评审对象 |
|---|---|
| 新增/重写 `backend/src/**/*.ts` | 该模块所有文件 |
| 新增/重写 `frontend/src/**/*.{ts,tsx}` | 该模块所有文件 |
| 修改 `prisma/schema.prisma` | schema + 受影响的 service |
| 生成 `docs/**/*_v2.md` 或 `docs/**/PRD*.md` 等设计文档 | 该批次所有文档 |
| 修改 `docker-compose.yml` / 关键配置 | 该配置 |

**不触发**：
- README typo / 微调
- 单条 comment 变更
- 本流程文档自身的修改
- 用户明确说"先不评审"或"直接 commit"

---

## 2. 评审 5 步流程

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: 生成产物                                        │
│  Step 2: 启动 Reviewer 子代理（readonly）                │
│  Step 3: 拿评审报告 → 落盘到 docs/reviews/              │
│  Step 4: 自动修复 P0 + 关键 P1                          │
│  Step 5: Self-check 通过 → git commit                   │
└─────────────────────────────────────────────────────────┘
```

### Step 2：启动 Reviewer

使用 `Task` 工具，配置：

```yaml
subagent_type: generalPurpose
readonly: true                  # Reviewer 不能改文件
description: <topic> 评审
prompt:
  - 评审对象的绝对路径清单
  - 6 维评分表（见 §3）
  - 项目特定准则（见 §4）
  - 输出格式（见 §5）
  - 风格要求：严格挑刺，宁挑 30 个不漏 1 个 P0
```

### Step 3：报告落盘

评审报告必须保存到：

```
docs/reviews/{YYYYMMDD}_{topic}.md
```

例：`docs/reviews/20260527_v2_docs_initial.md`

### Step 4：修复策略

| 优先级 | 修复要求 |
|---|---|
| **P0**（阻塞） | **100% 必修**；不修不入库 |
| **P1**（重要） | **≥ 80% 必修**；遗留项写入 commit message 的 "Deferred P1" 段 |
| **P2**（次要） | 择优修；可留到下次 |

修复后，如果改动量 > 30% 或引入新设计，**再走一轮评审**（同一个 Reviewer 用 resume）。

### Step 5：入库自检

commit 前 AI 必须自检：

- [ ] 所有 P0 已修复
- [ ] 文档/代码内部一致（命名、字段、枚举对齐）
- [ ] 评审报告已落盘到 `docs/reviews/`
- [ ] 若修改了 schema，迁移文件已生成
- [ ] commit message 包含 "Reviewed by: subagent {agent_id}"

任一项未达标 → 不允许 commit，返回 Step 4。

---

## 3. 6 维评分表（Reviewer 必用）

每份文档/模块从下列 6 维各给 A/B/C/D：

| 维度 | 含义 |
|---|---|
| **一致性** | 与其他文档/模块的字段/枚举/接口/数字是否对齐 |
| **完整性** | 是否有"提到但没定义"的概念；引用是否都解析 |
| **可执行性** | 开发者拿到能否直接开工；是否有模糊的"如何实现" |
| **正确性** | 业务逻辑是否合理（健美场景下的真实性） |
| **风险** | 安全 / 合规 / 性能 / 隐私的隐患 |
| **项目准则** | 是否违反 `UX_PRINCIPLES.md` 等强约束 |

总评 A：建议通过；B：通过待修复；C：必须重做部分模块；D：整体打回。

---

## 4. 项目特定的评审准则

不同类型的产物用不同准则：

| 产物 | 必看准则 |
|---|---|
| 前端代码 | `UX_PRINCIPLES.md` §9 的 10 条 PR Checklist |
| 后端 API | `API_DESIGN_v2.md` §0 的幂等 / 离线 / 权限矩阵 |
| Prisma schema | `DATABASE_SCHEMA_v2.md` §0 的通用字段约定（client_op_id 必有等） |
| PED 模块 | `PRD_v2.md` §5.5 的合规边界 + 商店分发策略 |
| 教练相关 | 字段级 scope + audit_logs 是否完整 |

---

## 5. Reviewer 输出格式（强制）

Reviewer 子代理必须按下列格式输出，便于自动解析：

```markdown
# {topic} 评审报告

## 总评
- 总分：A/B/C/D
- 建议：通过 / 通过待修复 / 不通过

## 评分表
| 项 | 一致性 | 完整性 | 可执行性 | 正确性 | 风险 | 项目准则 |
| ... |

## 发现的问题

### P0（必须修，阻塞）
1. [问题简述]
   - 出现位置：{file}:{section}
   - 问题详情：...
   - 修复建议：...

### P1（应该修，影响开发）
...

### P2（建议修）
...

## 跨文档/跨模块冲突
（列表）

## 总结
（3-5 句话）
```

---

## 6. 多轮评审

某些大型变更需要多轮评审：

- 第 1 轮：发现 → 修 P0
- 第 2 轮（resume Reviewer）：确认 P0 已解决 → 修 P1
- 第 3 轮（如需）：最终 self-check

每轮的报告都要落盘，命名加序号：
`docs/reviews/20260527_v2_docs_initial_r1.md` / `_r2.md`

---

## 7. 评审报告归档目录结构

```
docs/reviews/
├── README.md                                 # 索引（自动维护）
├── 20260527_v2_docs_initial_r1.md
├── 20260527_v2_docs_initial_r2.md
├── 20260603_prisma_schema_v2_init.md
├── 20260610_workouts_module.md
└── ...
```

每条 entry 在 `docs/reviews/README.md` 索引一行：
```markdown
| 日期 | 主题 | 评审版本 | 总评 | P0 数 | P1 数 |
```

---

## 8. 与 git 的衔接

入库标准的 commit message 模板：

```
{type}({scope}): {subject}

Reviewed by: subagent {agent_id_short}
Review report: docs/reviews/{date}_{topic}_r{N}.md
P0 fixed: {n}/{n}
P1 fixed: {n}/{n}
Deferred P1:
  - {item 1}
  - {item 2}
```

---

## 9. 例外通道

| 情况 | 处理 |
|---|---|
| 用户说"先不评审" | 跳过；commit message 注明 "skip-review: user requested" |
| 用户标记 `[hotfix]` | 评审降级为 self-review；事后 24h 内补独立评审 |
| Reviewer 子代理失败 / 超时 | 重试 1 次；仍失败则 fallback 到 self-review + 告知用户 |
| 没有评审对象（纯文案变更） | 不评审；可直接 commit |

---

## 10. 这个流程本身的演化

本流程文档和 `.cursor/rules/auto-review.mdc` 自身的修改 **必须**经过用户明确同意，
AI 不应自行修改这两份文件。

---

**Last Updated**: 2026-05-27  
**Owner**: FitFlow Pro Team
