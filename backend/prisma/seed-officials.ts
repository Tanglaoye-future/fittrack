/**
 * 官方预设种子（哑铃区 4 分化 · 高级选手）
 *
 * 用法：`npm run db:seed:officials`
 *
 * 与原 `seed.ts` 解耦的目的：
 * - 原 seed.ts 含 v1 表 demo 数据（已废弃），不应作为新开发依赖
 * - 本入口仅写官方 Exercise / Food 字典数据（is_official=true），幂等可重跑
 * - 官方训练计划与餐单不入库，作为代码常量存于 src/training-plans/official-plans.ts
 *   与 src/meals/official-meal-plans.ts，仅在用户调 from-official API 时按当前用户实例化
 */

import { PrismaClient } from '@prisma/client';
import { seedOfficialExercises } from './seed-officials/exercises';
import { seedOfficialFoods } from './seed-officials/foods';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子官方预设库...');
  const exStats = await seedOfficialExercises(prisma);
  console.log(
    `🏋️  官方动作库: 新增 ${exStats.created}, 更新 ${exStats.updated}, 跳过用户私有 ${exStats.skipped}, 共 ${exStats.total}`,
  );
  const foodStats = await seedOfficialFoods(prisma);
  console.log(
    `🍱 官方食材库: 新增 ${foodStats.created}, 更新 ${foodStats.updated}, 跳过用户私有 ${foodStats.skipped}, 共 ${foodStats.total}`,
  );
  console.log(`
✅ 官方预设就绪。

训练计划（slug）：
  - dumbbell-4split-offseason  哑铃 4 分化 · 增肌期（OFFSEASON）
  - dumbbell-4split-prep       哑铃 4 分化 · 减脂期（PREP）

餐单（slug）：
  - dumbbell-meals-bulk        增肌期 5 餐 · ~3050 kcal
  - dumbbell-meals-cut         减脂期 5 餐 · ~2010 kcal

前端按 slug 调：
  POST /api/v1/training-plans/from-official/:slug
  POST /api/v1/meals/plan-templates/from-official/:slug
  `);
}

main()
  .catch((e) => {
    console.error('❌ 官方预设种子失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
