import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

export interface CreateCheckInDto {
  prep_cycle_id?: string;
  week_index: number;
  check_in_date: string;
  subjective_condition?: number;
  hunger_score?: number;
  sleep_quality_score?: number;
  stress_score?: number;
  athlete_notes?: string;
  client_op_id: string;
  client_ts: string;
}

export interface CoachReviewDto {
  coach_notes?: string;
  coach_adjustment_kcal_delta?: number;
  coach_adjustment_protein_delta_g?: number;
  coach_adjustment_carbs_delta_g?: number;
  coach_adjustment_fat_delta_g?: number;
  coach_adjustment_cardio_min_delta?: number;
  coach_adjustment_steps_delta?: number;
  coach_adjustment_effective_from?: string;
}

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.weeklyCheckIn.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { photos: true },
      orderBy: { check_in_date: 'desc' },
    });
  }

  async getDraft(userId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [recentSessions, recentMeals, recentBody] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where: { user_id: userId, deleted_at: null, session_date: { gte: sevenDaysAgo } },
        select: { session_date: true, overall_rpe: true },
      }),
      this.prisma.mealLog.findMany({
        where: { user_id: userId, deleted_at: null, meal_date: { gte: sevenDaysAgo } },
        select: { total_kcal: true },
      }),
      this.prisma.bodyRecord.findFirst({
        where: { user_id: userId, deleted_at: null },
        orderBy: { measurement_date: 'desc' },
        select: { morning_weight_kg: true, measurement_date: true },
      }),
    ]);

    const avgKcal =
      recentMeals.length > 0
        ? Math.round(
            recentMeals.reduce((s, m) => s + Number(m.total_kcal ?? 0), 0) / recentMeals.length,
          )
        : null;

    return {
      week_index: this.getCurrentWeekIndex(),
      check_in_date: today.toISOString().split('T')[0],
      trainings_completed: recentSessions.length,
      avg_kcal_actual: avgKcal,
      avg_morning_weight: recentBody?.morning_weight_kg ?? null,
      prefilled: true,
    };
  }

  async create(userId: string, dto: CreateCheckInDto) {
    const existing = await this.prisma.weeklyCheckIn.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.weeklyCheckIn.create({
      data: {
        user_id: userId,
        prep_cycle_id: dto.prep_cycle_id,
        week_index: dto.week_index,
        check_in_date: new Date(dto.check_in_date),
        subjective_condition: dto.subjective_condition,
        hunger_score: dto.hunger_score,
        sleep_quality_score: dto.sleep_quality_score,
        stress_score: dto.stress_score,
        athlete_notes: dto.athlete_notes,
        status: 'SUBMITTED',
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
      include: { photos: true },
    });
  }

  async findOne(id: string, userId: string) {
    const checkIn = await this.prisma.weeklyCheckIn.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { photos: true },
    });
    if (!checkIn) throw new NotFoundException('Check-in 不存在');
    return checkIn;
  }

  async coachReview(id: string, coachId: string, dto: CoachReviewDto) {
    const checkIn = await this.prisma.weeklyCheckIn.findFirst({ where: { id } });
    if (!checkIn) throw new NotFoundException('Check-in 不存在');

    return this.prisma.weeklyCheckIn.update({
      where: { id },
      data: {
        coach_notes: dto.coach_notes,
        coach_adjustment_kcal_delta: dto.coach_adjustment_kcal_delta,
        coach_adjustment_protein_delta_g: dto.coach_adjustment_protein_delta_g,
        coach_adjustment_carbs_delta_g: dto.coach_adjustment_carbs_delta_g,
        coach_adjustment_fat_delta_g: dto.coach_adjustment_fat_delta_g,
        coach_adjustment_cardio_min_delta: dto.coach_adjustment_cardio_min_delta,
        coach_adjustment_steps_delta: dto.coach_adjustment_steps_delta,
        coach_adjustment_effective_from: dto.coach_adjustment_effective_from
          ? new Date(dto.coach_adjustment_effective_from)
          : undefined,
        coach_response_at: new Date(),
        status: 'COACH_REVIEWED',
      },
    });
  }

  private getCurrentWeekIndex(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 86400000));
  }
}
