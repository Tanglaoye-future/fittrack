import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库初始化...');

  // 清除现有数据
  await prisma.dailySummary.deleteMany();
  await prisma.bodyRecord.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  已清除现有数据');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('test123456', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'test@fitflow.com',
      username: 'testuser',
      passwordHash: hashedPassword,
      gender: 'MALE',
      age: 28,
      height: 180,
      initial_weight: 75,
      fitness_goal: 'GAIN_MUSCLE',
    },
  });

  console.log(`✅ 创建测试用户: ${user1.username}`);

  // 创建示例数据
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 创建示例饮食记录
  await prisma.meal.create({
    data: {
      user_id: user1.id,
      meal_type: 'BREAKFAST',
      food_name: '鸡蛋炒饭',
      calories: 450,
      protein: 15,
      carbs: 45,
      fat: 18,
      meal_date: today,
    },
  });

  // 创建示例训练记录
  await prisma.workout.create({
    data: {
      user_id: user1.id,
      workout_type: 'STRENGTH',
      exercise_name: '卧推',
      duration_minutes: 60,
      calories_burned: 300,
      intensity: 'HIGH',
      sets: 4,
      reps: 8,
      weight: 100,
      workout_date: today,
    },
  });

  // 创建示例消费记录
  await prisma.expense.create({
    data: {
      user_id: user1.id,
      category: 'GYM',
      amount: 199,
      description: '健身房月卡',
      expense_date: today,
    },
  });

  // 创建示例身体数据
  await prisma.bodyRecord.create({
    data: {
      user_id: user1.id,
      weight: 75,
      body_fat_percentage: 20,
      muscle_mass: 60,
      chest: 100,
      waist: 85,
      hip: 95,
      arm: 35,
      thigh: 58,
      measurement_date: today,
    },
  });

  console.log('✅ 已创建示例数据');
  console.log(`
📊 数据库初始化完成！
用户: test@fitflow.com
密码: test123456
  `);
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
