import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDailySummary(userId: string, date: string) {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const [meals, workouts, expenses] = await Promise.all([
      this.prisma.meal.findMany({
        where: { user_id: userId, meal_date: { gte: day, lt: nextDay }, deleted_at: null },
      }),
      this.prisma.workout.findMany({
        where: { user_id: userId, workout_date: { gte: day, lt: nextDay }, deleted_at: null },
      }),
      this.prisma.expense.findMany({
        where: { user_id: userId, expense_date: { gte: day, lt: nextDay }, deleted_at: null },
      }),
    ]);

    const totalCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
    const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (Number(w.calories_burned) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      date,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      total_calories_burned: totalCaloriesBurned,
      total_expenses: totalExpenses,
      meals_count: meals.length,
      workouts_count: workouts.length,
    };
  }

  async getWeeklySummary(userId: string, startDate: string, endDate: string) {
    const days: any[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const summary = await this.getDailySummary(userId, dateStr);
      days.push(summary);
      current.setDate(current.getDate() + 1);
    }

    const totals = days.reduce(
      (acc, d) => ({
        total_calories: acc.total_calories + d.total_calories,
        total_protein: acc.total_protein + d.total_protein,
        total_carbs: acc.total_carbs + d.total_carbs,
        total_fat: acc.total_fat + d.total_fat,
        total_calories_burned: acc.total_calories_burned + d.total_calories_burned,
        total_expenses: acc.total_expenses + d.total_expenses,
        total_meals: acc.total_meals + d.meals_count,
        total_workouts: acc.total_workouts + d.workouts_count,
      }),
      { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, total_calories_burned: 0, total_expenses: 0, total_meals: 0, total_workouts: 0 },
    );

    return {
      start_date: startDate,
      end_date: endDate,
      days,
      totals,
    };
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.getWeeklySummary(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    );
  }

  async getCaloriesTrend(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [meals, workouts] = await Promise.all([
      this.prisma.meal.findMany({
        where: { user_id: userId, meal_date: { gte: start, lte: end }, deleted_at: null },
        orderBy: { meal_date: 'asc' },
      }),
      this.prisma.workout.findMany({
        where: { user_id: userId, workout_date: { gte: start, lte: end }, deleted_at: null },
        orderBy: { workout_date: 'asc' },
      }),
    ]);

    const trendMap = new Map<string, { calories_in: number; calories_out: number }>();

    for (const m of meals) {
      const dateKey = new Date(m.meal_date).toISOString().split('T')[0];
      const entry = trendMap.get(dateKey) || { calories_in: 0, calories_out: 0 };
      entry.calories_in += Number(m.calories) || 0;
      trendMap.set(dateKey, entry);
    }

    for (const w of workouts) {
      const dateKey = new Date(w.workout_date).toISOString().split('T')[0];
      const entry = trendMap.get(dateKey) || { calories_in: 0, calories_out: 0 };
      entry.calories_out += Number(w.calories_burned) || 0;
      trendMap.set(dateKey, entry);
    }

    const trend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    return { start_date: startDate, end_date: endDate, trend };
  }

  async getNutritionAnalysis(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const meals = await this.prisma.meal.findMany({
      where: { user_id: userId, meal_date: { gte: start, lte: end }, deleted_at: null },
    });

    const totalProtein = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0);
    const totalCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;

    const byMealType = new Map<string, { calories: number; protein: number; carbs: number; fat: number; count: number }>();
    for (const m of meals) {
      const entry = byMealType.get(m.meal_type) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      entry.calories += Number(m.calories) || 0;
      entry.protein += Number(m.protein) || 0;
      entry.carbs += Number(m.carbs) || 0;
      entry.fat += Number(m.fat) || 0;
      entry.count += 1;
      byMealType.set(m.meal_type, entry);
    }

    return {
      start_date: startDate,
      end_date: endDate,
      totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      by_meal_type: Object.fromEntries(byMealType),
    };
  }

  async getExpenseAnalysis(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const expenses = await this.prisma.expense.findMany({
      where: { user_id: userId, expense_date: { gte: start, lte: end }, deleted_at: null },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const byCategory = new Map<string, { amount: number; count: number }>();
    for (const e of expenses) {
      const entry = byCategory.get(e.category) || { amount: 0, count: 0 };
      entry.amount += Number(e.amount);
      entry.count += 1;
      byCategory.set(e.category, entry);
    }

    return {
      start_date: startDate,
      end_date: endDate,
      total_amount: total,
      transaction_count: expenses.length,
      by_category: Object.fromEntries(byCategory),
    };
  }
}
