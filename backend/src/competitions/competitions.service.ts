import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateCompetitionDto,
  UpdateCompetitionDto,
  CreatePrepCycleDto,
  CreatePhaseConfigDto,
  UpdatePhaseConfigDto,
} from './dto/competitions.dto';

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Competitions ───────────────────────────────────────────────────────────

  async list(userId: string) {
    return this.prisma.competitionGoal.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { prep_cycles: { include: { phases: true } } },
      orderBy: { stage_date: 'asc' },
    });
  }

  async create(userId: string, dto: CreateCompetitionDto) {
    const existing = await this.prisma.competitionGoal.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.competitionGoal.create({
      data: {
        user_id: userId,
        name: dto.name,
        federation: dto.federation,
        category: dto.category,
        stage_date: new Date(dto.stage_date),
        location: dto.location,
        target_weight_kg: dto.target_weight_kg,
        notes: dto.notes,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.competitionGoal.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { prep_cycles: { include: { phases: true } } },
    });
    if (!goal) throw new NotFoundException('比赛目标不存在');
    return goal;
  }

  async update(id: string, userId: string, dto: UpdateCompetitionDto) {
    await this.findOne(id, userId);
    const { client_op_id: _, client_ts: __, ...rest } = dto;
    return this.prisma.competitionGoal.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.stage_date && { stage_date: new Date(rest.stage_date) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.competitionGoal.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async getActiveCountdown(userId: string) {
    const goal = await this.prisma.competitionGoal.findFirst({
      where: { user_id: userId, is_active: true, deleted_at: null },
      include: {
        prep_cycles: {
          where: { is_active: true },
          include: { phases: true },
          take: 1,
        },
      },
    });

    if (!goal) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stageDate = new Date(goal.stage_date);
    const daysRemaining = Math.ceil((stageDate.getTime() - today.getTime()) / 86400000);

    return {
      competition: goal,
      days_remaining: daysRemaining,
      current_prep_cycle: goal.prep_cycles[0] ?? null,
    };
  }

  // ── Prep Cycles ────────────────────────────────────────────────────────────

  async createPrepCycle(goalId: string, userId: string, dto: CreatePrepCycleDto) {
    const goal = await this.findOne(goalId, userId);
    const existing = await this.prisma.prepCycle.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const startDate = new Date(dto.start_date);
    const endDate = new Date(goal.stage_date);
    const weeksTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 86400000));

    return this.prisma.prepCycle.create({
      data: {
        user_id: userId,
        goal_id: goalId,
        start_date: startDate,
        end_date: endDate,
        weeks_total: weeksTotal,
        start_weight_kg: dto.start_weight_kg,
        start_body_fat_pct: dto.start_body_fat_pct,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
      include: { phases: true },
    });
  }

  async getPrepCycle(goalId: string, cycleId: string, userId: string) {
    await this.findOne(goalId, userId);
    const cycle = await this.prisma.prepCycle.findFirst({
      where: { id: cycleId, goal_id: goalId },
      include: { phases: true },
    });
    if (!cycle) throw new NotFoundException('备赛周期不存在');
    return cycle;
  }

  async addPhase(goalId: string, cycleId: string, userId: string, dto: CreatePhaseConfigDto) {
    await this.getPrepCycle(goalId, cycleId, userId);
    const existing = await this.prisma.phaseConfig.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.phaseConfig.create({
      data: {
        prep_cycle_id: cycleId,
        phase: dto.phase as never,
        week_start: dto.week_start,
        week_end: dto.week_end,
        kcal: dto.kcal,
        protein_g: dto.protein_g,
        carbs_g: dto.carbs_g,
        fat_g: dto.fat_g,
        cardio_sessions_per_week: dto.cardio_sessions_per_week ?? 0,
        cardio_minutes_per_session: dto.cardio_minutes_per_session ?? 0,
        cardio_type: dto.cardio_type,
        daily_steps: dto.daily_steps,
        notes: dto.notes,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async updatePhase(phaseId: string, userId: string, dto: UpdatePhaseConfigDto) {
    const phase = await this.prisma.phaseConfig.findFirst({ where: { id: phaseId } });
    if (!phase) throw new NotFoundException('阶段配置不存在');

    const { client_op_id: _, client_ts: __, ...rest } = dto;
    return this.prisma.phaseConfig.update({
      where: { id: phaseId },
      data: { ...rest, ...(rest.phase && { phase: rest.phase as never }) },
    });
  }

  async autoGeneratePhases(cycleId: string, userId: string) {
    const cycle = await this.prisma.prepCycle.findFirst({
      where: { id: cycleId, user_id: userId },
    });
    if (!cycle) throw new NotFoundException('备赛周期不存在');

    await this.prisma.phaseConfig.deleteMany({ where: { prep_cycle_id: cycleId } });

    const totalWeeks = cycle.weeks_total;
    const phases: Array<{ phase: string; week_start: number; week_end: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }> = [];

    if (totalWeeks >= 16) {
      phases.push(
        { phase: 'OFFSEASON', week_start: 1, week_end: 4, kcal: 3000, protein_g: 220, carbs_g: 300, fat_g: 80 },
        { phase: 'PREP', week_start: 5, week_end: totalWeeks - 1, kcal: 2500, protein_g: 240, carbs_g: 200, fat_g: 60 },
        { phase: 'PEAK_WEEK', week_start: totalWeeks, week_end: totalWeeks, kcal: 2200, protein_g: 250, carbs_g: 150, fat_g: 50 },
      );
    } else {
      phases.push(
        { phase: 'PREP', week_start: 1, week_end: totalWeeks - 1, kcal: 2500, protein_g: 240, carbs_g: 200, fat_g: 60 },
        { phase: 'PEAK_WEEK', week_start: totalWeeks, week_end: totalWeeks, kcal: 2200, protein_g: 250, carbs_g: 150, fat_g: 50 },
      );
    }

    const { randomUUID } = await import('crypto');
    const now = new Date();

    await this.prisma.phaseConfig.createMany({
      data: phases.map((p) => ({
        prep_cycle_id: cycleId,
        phase: p.phase as never,
        week_start: p.week_start,
        week_end: p.week_end,
        kcal: p.kcal,
        protein_g: p.protein_g,
        carbs_g: p.carbs_g,
        fat_g: p.fat_g,
        client_op_id: randomUUID(),
        client_ts: now,
      })),
    });

    return this.prisma.phaseConfig.findMany({ where: { prep_cycle_id: cycleId } });
  }

  async getTodayTargets(cycleId: string, userId: string) {
    const cycle = await this.prisma.prepCycle.findFirst({
      where: { id: cycleId, user_id: userId },
      include: { phases: { orderBy: { week_start: 'asc' } } },
    });
    if (!cycle) throw new NotFoundException('备赛周期不存在');

    const today = new Date();
    const daysSinceStart = Math.floor(
      (today.getTime() - new Date(cycle.start_date).getTime()) / 86400000,
    );
    const currentWeek = Math.floor(daysSinceStart / 7) + 1;

    const currentPhase = cycle.phases.find(
      (p) => currentWeek >= p.week_start && currentWeek <= p.week_end,
    );

    return {
      cycle_id: cycleId,
      current_week: currentWeek,
      weeks_total: cycle.weeks_total,
      current_phase: currentPhase ?? null,
    };
  }
}
