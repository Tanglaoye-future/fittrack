/**
 * 主 seed 入口（v2）
 *
 * 历史：原文件含 v1 demo 数据（prisma.workout / prisma.meal 等 v1 表写入），
 * 与 v2 schema 不兼容会直接编译/运行失败。R2 评审 P0：已剔除全部 v1 demo 逻辑。
 *
 * 现在只做两件事：
 * 1. 官方动作 / 食材字典种子（幂等，可安全重跑）
 * 2. 一名 v2-shape 测试用户（已存在则跳过）
 *
 * 官方训练计划 / 餐单作为代码常量保存，不入库；由 cloneFromOfficial 按用户实例化。
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedOfficialExercises } from './seed-officials/exercises';
import { seedOfficialFoods } from './seed-officials/foods';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 v2 主 seed 启动...');

  const existing = await prisma.user.findUnique({ where: { email: 'test@fitflow.com' } });
  if (!existing) {
    const password_hash = await bcrypt.hash('test123456', 10);
    await prisma.user.create({
      data: {
        email: 'test@fitflow.com',
        username: 'testuser',
        password_hash,
        gender: 'MALE',
        birth_date: new Date('1996-01-01'),
        height_cm: 180,
        initial_weight_kg: 75,
      },
    });
    console.log('✅ 创建测试用户: test@fitflow.com / test123456');
  } else {
    console.log('ℹ️  测试用户已存在，跳过');
  }

  const exStats = await seedOfficialExercises(prisma);
  console.log(
    `🏋️  官方动作库: 新增 ${exStats.created}, 更新 ${exStats.updated}, 跳过用户私有 ${exStats.skipped}, 共 ${exStats.total}`,
  );
  const foodStats = await seedOfficialFoods(prisma);
  console.log(
    `🍱 官方食材库: 新增 ${foodStats.created}, 更新 ${foodStats.updated}, 跳过用户私有 ${foodStats.skipped}, 共 ${foodStats.total}`,
  );

  console.log(`
📊 v2 初始化完成。

官方训练计划（slug）：
  - dumbbell-4split-offseason  哑铃 4 分化 · 增肌期
  - dumbbell-4split-prep       哑铃 4 分化 · 减脂期
官方餐单：
  - dumbbell-meals-bulk        增肌期 5 餐
  - dumbbell-meals-cut         减脂期 5 餐
`);
}

main()
  .catch((e) => {
    console.error('❌ seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
