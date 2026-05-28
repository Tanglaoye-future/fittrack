import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

interface PeriodQuery {
  period?: string;
  date_from?: string;
  date_to?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(query: PeriodQuery): { from: Date; to: Date } {
    if (query.date_from && query.date_to) {
      return { from: new Date(query.date_from), to: new Date(query.date_to) };
    }
    const days = query.period?.includes('d') ? parseInt(query.period) : 30;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from, to };
  }

  async getStrengthTrends(userId: string, exerciseId: string, query: PeriodQuery) {
    const { from, to } = this.getDateRange(query);

    const prs = await this.prisma.personalRecord.findMany({
      where: { user_id: userId, exercise_id: exerciseId },
      include: { exercise: { select: { name_zh: true } } },
    });

    const sessions = await this.prisma.setEntry.findMany({
      where: {
        user_id: userId,
        exercise_id: exerciseId,
        session_date: { gte: from, lte: to },
        deleted_at: null,
        set_type: { in: ['WORKING', 'CLUSTER', 'AMRAP'] },
      },
      select: { session_date: true, weight_kg: true, reps: true },
      orderBy: { session_date: 'asc' },
    });

    return { prs, sessions };
  }

  async getBodyWeightTrends(userId: string, query: PeriodQuery) {
    const { from, to } = this.getDateRange(query);

    return this.prisma.bodyRecord.findMany({
      where: {
        user_id: userId,
        measurement_date: { gte: from, lte: to },
        deleted_at: null,
      },
      select: {
        measurement_date: true,
        morning_weight_kg: true,
        body_fat_percentage: true,
      },
      orderBy: { measurement_date: 'asc' },
    });
  }

  async getMacroTrends(userId: string, query: PeriodQuery) {
    const { from, to } = this.getDateRange(query);

    const meals = await this.prisma.mealLog.findMany({
      where: {
        user_id: userId,
        meal_date: { gte: from, lte: to },
        deleted_at: null,
      },
      select: { meal_date: true, total_kcal: true, total_protein: true, total_carbs: true, total_fat: true },
    });

    const byDate = meals.reduce<Record<string, { kcal: number; protein: number; carbs: number; fat: number }>>(
      (acc, m) => {
        const key = new Date(m.meal_date).toISOString().split('T')[0];
        if (!acc[key]) acc[key] = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
        acc[key].kcal += Number(m.total_kcal ?? 0);
        acc[key].protein += Number(m.total_protein ?? 0);
        acc[key].carbs += Number(m.total_carbs ?? 0);
        acc[key].fat += Number(m.total_fat ?? 0);
        return acc;
      },
      {},
    );

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, macros]) => ({ date, ...macros }));
  }

  async getDailySummaries(userId: string, query: PeriodQuery) {
    const { from, to } = this.getDateRange(query);

    return this.prisma.dailySummary.findMany({
      where: {
        user_id: userId,
        summary_date: { gte: from, lte: to },
      },
      orderBy: { summary_date: 'asc' },
    });
  }

  async getPrepProgress(userId: string, cycleId: string) {
    const cycle = await this.prisma.prepCycle.findFirst({
      where: { id: cycleId, user_id: userId },
      include: { phases: true },
    });

    if (!cycle) return null;

    const startDate = new Date(cycle.start_date);
    const endDate = new Date(cycle.end_date);
    const today = new Date();

    const bodyRecords = await this.prisma.bodyRecord.findMany({
      where: {
        user_id: userId,
        measurement_date: { gte: startDate, lte: today },
        deleted_at: null,
      },
      select: { measurement_date: true, morning_weight_kg: true, body_fat_percentage: true },
      orderBy: { measurement_date: 'asc' },
    });

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / 86400000);

    return {
      cycle,
      progress_pct: Math.round((daysElapsed / totalDays) * 100),
      days_elapsed: daysElapsed,
      days_remaining: totalDays - daysElapsed,
      body_records: bodyRecords,
    };
  }
}
