# FitFlow Pro — 评审报告索引

按时间倒序排列，便于查找。由 AI 在每次评审后自动追加。

---

| 日期 | 主题 | 版本 | 总评 | P0 修 | P1 修 | 状态 | 报告 |
|---|---|---|---|---|---|---|---|
| 2026-05-27 | v2 设计文档 | R1 | C+ | 0/8 | 0/22 | 通过待修复 | [20260527_v2_docs_initial_r1.md](./20260527_v2_docs_initial_r1.md) |
| 2026-05-27 | v2 设计文档 | R2 | ✅ | 8/8 | 17/17 必修 | **可入库** | [20260527_v2_docs_initial_r2.md](./20260527_v2_docs_initial_r2.md) |

---

## 评审命名规范

```
{YYYYMMDD}_{topic_snake_case}_r{N}.md
```

- `YYYYMMDD` — 评审执行日期
- `topic_snake_case` — 简短主题（如 `v2_docs_initial`、`workouts_module`、`prisma_schema_v2_init`）
- `r{N}` — 第几轮评审（R1 / R2 …）

## 评审流程

详见 [../REVIEW_PROCESS.md](../REVIEW_PROCESS.md) 和 [.cursor/rules/auto-review.mdc](../../.cursor/rules/auto-review.mdc)。
