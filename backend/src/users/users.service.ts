import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [total_meals, total_workouts, expenseAgg, total_body_records] = await Promise.all([
      this.prisma.mealV1.count({ where: { user_id: userId, deleted_at: null } }),
      this.prisma.workoutV1.count({ where: { user_id: userId, deleted_at: null } }),
      this.prisma.expense.aggregate({
        where: { user_id: userId, deleted_at: null },
        _sum: { amount: true },
      }),
      this.prisma.bodyRecord.count({ where: { user_id: userId, deleted_at: null } }),
    ]);

    return {
      total_meals,
      total_workouts,
      total_expenses: Number(expenseAgg._sum.amount ?? 0),
      total_body_records,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileInput) {
    const data: Record<string, unknown> = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.gender !== undefined) data.gender = dto.gender as never;
    if (dto.height !== undefined) data.height_cm = dto.height;
    if (dto.age !== undefined) {
      const year = new Date().getFullYear() - dto.age;
      data.birth_date = new Date(year, 0, 1);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        gender: true,
        birth_date: true,
        height_cm: true,
        avatar_url: true,
        is_athlete: true,
        is_coach: true,
        subscription_tier: true,
      },
    });

    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }
}

interface UpdateProfileInput {
  username?: string;
  gender?: string;
  age?: number;
  height?: number;
  fitness_goal?: string;
}
