import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        gender: true,
        age: true,
        height: true,
        fitness_goal: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username && { username: dto.username }),
        ...(dto.gender !== undefined && { gender: dto.gender as any }),
        ...(dto.age !== undefined && { age: dto.age }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(dto.fitness_goal !== undefined && { fitness_goal: dto.fitness_goal as any }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        gender: true,
        age: true,
        height: true,
        fitness_goal: true,
        updated_at: true,
      },
    });

    this.logger.log(`用户资料已更新: ${user.email}`);
    return user;
  }

  async getUserStats(userId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [mealCount, workoutCount, expenseCount, bodyRecordCount] = await Promise.all([
      this.prisma.meal.count({
        where: { user_id: userId, meal_date: { gte: start, lte: end }, deleted_at: null },
      }),
      this.prisma.workout.count({
        where: { user_id: userId, workout_date: { gte: start, lte: end }, deleted_at: null },
      }),
      this.prisma.expense.count({
        where: { user_id: userId, expense_date: { gte: start, lte: end }, deleted_at: null },
      }),
      this.prisma.bodyRecord.count({
        where: { user_id: userId, measurement_date: { gte: start, lte: end } },
      }),
    ]);

    const totalExpenses = await this.prisma.expense.aggregate({
      where: { user_id: userId, expense_date: { gte: start, lte: end }, deleted_at: null },
      _sum: { amount: true },
    });

    return {
      period: { start_date: start.toISOString(), end_date: end.toISOString() },
      total_meals: mealCount,
      total_workouts: workoutCount,
      total_expenses: totalExpenses._sum.amount || 0,
      total_body_records: bodyRecordCount,
    };
  }
}
