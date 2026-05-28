import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { PrService } from './pr.service';
import {
  StartSessionDto,
  FinishSessionDto,
  UpdateSessionDto,
  ListSessionsDto,
  AddSessionExerciseDto,
  UpdateSessionExerciseDto,
  CreateSetEntryDto,
  UpdateSetEntryDto,
  BatchSetsDto,
} from './dto/workouts.dto';

const SESSION_INCLUDE = {
  exercises: {
    include: {
      exercise: true,
      sets: { where: { deleted_at: null }, orderBy: { set_index: 'asc' as const } },
    },
    orderBy: { order_index: 'asc' as const },
  },
} as const;

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prService: PrService,
  ) {}

  // ── Sessions ───────────────────────────────────────────────────────────────

  async listSessions(userId: string, dto: ListSessionsDto) {
    const { date, date_from, date_to, plan_id, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };

    if (date) where.session_date = new Date(date);
    if (date_from || date_to) {
      where.session_date = {
        ...(date_from ? { gte: new Date(date_from) } : {}),
        ...(date_to ? { lte: new Date(date_to) } : {}),
      };
    }
    if (plan_id) {
      // Filter by plan: template must belong to that plan
      where.template = { plan_id };
    }

    const [items, total] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where,
        skip,
        take: limit,
        include: SESSION_INCLUDE,
        orderBy: [{ session_date: 'desc' }, { start_time: 'desc' }],
      }),
      this.prisma.workoutSession.count({ where }),
    ]);

    return { items, meta: { page, limit, total, has_next: skip + items.length < total } };
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.workoutSession.findMany({
      where: { user_id: userId, session_date: today, deleted_at: null },
      include: SESSION_INCLUDE,
      orderBy: { start_time: 'asc' },
    });
  }

  async startSession(userId: string, dto: StartSessionDto) {
    // Idempotency: return existing if same client_op_id
    const existing = await this.prisma.workoutSession.findUnique({
      where: { client_op_id: dto.client_op_id },
      include: SESSION_INCLUDE,
    });
    if (existing) return this.withSuggestedSets(existing, userId);

    let templateExercises: TemplateExerciseWithExercise[] = [];

    if (dto.template_id) {
      const tmpl = await this.prisma.trainingTemplate.findUnique({
        where: { id: dto.template_id },
        include: {
          exercises: {
            orderBy: { order_index: 'asc' },
            include: { exercise: true },
          },
        },
      });
      if (!tmpl) throw new NotFoundException('训练模板不存在');
      templateExercises = tmpl.exercises;
    }

    const session = await this.prisma.workoutSession.create({
      data: {
        user_id: userId,
        template_id: dto.template_id,
        session_date: new Date(dto.session_date),
        start_time: new Date(),
        bodyweight_kg: dto.bodyweight_kg,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
        exercises: templateExercises.length
          ? {
              create: templateExercises.map((te, idx) => ({
                exercise_id: te.exercise_id,
                order_index: idx,
                template_exercise_id: te.id,
                client_op_id: randomUUID(),
                client_ts: new Date(),
              })),
            }
          : undefined,
      },
      include: SESSION_INCLUDE,
    });

    return this.withSuggestedSets(session, userId);
  }

  private async withSuggestedSets(session: SessionWithExercises, userId: string) {
    const exercisesWithSuggestions = await Promise.all(
      session.exercises.map(async (se) => {
        const templateEx = se.template_exercise_id
          ? await this.prisma.templateExercise.findUnique({
              where: { id: se.template_exercise_id },
            })
          : null;

        const targetSets = templateEx?.target_sets ?? 4;
        const suggestedSets = await this.buildSuggestedSets(
          userId,
          se.exercise_id,
          targetSets,
          templateEx,
        );

        return { ...se, target_sets: targetSets, suggested_sets: suggestedSets };
      }),
    );

    return { ...session, exercises: exercisesWithSuggestions };
  }

  private async buildSuggestedSets(
    userId: string,
    exerciseId: string,
    targetSets: number,
    templateEx: TemplateExInfo | null,
  ) {
    const suggestions: Record<string, unknown>[] = [];

    for (let i = 1; i <= targetSets; i++) {
      const cacheKey = `${exerciseId}:${i}`;
      const cached = await this.prisma.lastValueCache.findUnique({
        where: { user_id_domain_key: { user_id: userId, domain: 'SET', key: cacheKey } },
      });

      if (cached) {
        suggestions.push({
          set_index: i,
          source: 'LAST_VALUE',
          ...(cached.value as Record<string, unknown>),
        });
      } else if (templateEx) {
        suggestions.push({
          set_index: i,
          source: 'TEMPLATE',
          set_type: i === 1 && targetSets > 2 ? 'WARMUP' : 'WORKING',
          reps_min: templateEx.target_reps_min,
          reps_max: templateEx.target_reps_max,
          rir: templateEx.target_rir !== null ? Number(templateEx.target_rir) : null,
          rpe: templateEx.target_rpe !== null ? Number(templateEx.target_rpe) : null,
        });
      } else {
        suggestions.push({ set_index: i, source: 'EMPTY' });
      }
    }

    return suggestions;
  }

  async getSession(id: string, userId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: SESSION_INCLUDE,
    });
    if (!session) throw new NotFoundException('训练记录不存在');
    return session;
  }

  async updateSession(id: string, userId: string, dto: UpdateSessionDto) {
    await this.assertSessionOwner(id, userId);
    return this.prisma.workoutSession.update({
      where: { id },
      data: { overall_rpe: dto.overall_rpe, notes: dto.notes },
      include: SESSION_INCLUDE,
    });
  }

  async finishSession(id: string, userId: string, dto: FinishSessionDto) {
    await this.assertSessionOwner(id, userId);
    return this.prisma.workoutSession.update({
      where: { id },
      data: {
        end_time: new Date(),
        overall_rpe: dto.overall_rpe,
        notes: dto.notes,
      },
      include: SESSION_INCLUDE,
    });
  }

  async deleteSession(id: string, userId: string) {
    await this.assertSessionOwner(id, userId);
    await this.prisma.workoutSession.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { deleted: true };
  }

  async getSessionSummary(id: string, userId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: {
        exercises: {
          include: {
            exercise: { select: { id: true, name_zh: true, name_en: true } },
            sets: { where: { deleted_at: null } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('训练记录不存在');

    let totalSets = 0;
    let totalTonnage = 0;
    let rpeSum = 0;
    let rpeCount = 0;

    for (const se of session.exercises) {
      for (const s of se.sets) {
        totalSets++;
        if (s.weight_kg && s.reps) totalTonnage += Number(s.weight_kg) * s.reps;
        if (s.rpe) { rpeSum += Number(s.rpe); rpeCount++; }
      }
    }

    const duration =
      session.start_time && session.end_time
        ? Math.round((session.end_time.getTime() - session.start_time.getTime()) / 60000)
        : null;

    return {
      session_id: id,
      duration_minutes: duration,
      total_sets: totalSets,
      total_tonnage_kg: Math.round(totalTonnage * 10) / 10,
      avg_rpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
      exercise_count: session.exercises.length,
    };
  }

  // ── SessionExercises ───────────────────────────────────────────────────────

  async addSessionExercise(sessionId: string, userId: string, dto: AddSessionExerciseDto) {
    await this.assertSessionOwner(sessionId, userId);

    const existing = await this.prisma.sessionExercise.findUnique({
      where: { client_op_id: dto.client_op_id },
      include: { exercise: true, sets: true },
    });
    if (existing) return existing;

    const count = await this.prisma.sessionExercise.count({ where: { session_id: sessionId } });
    return this.prisma.sessionExercise.create({
      data: {
        session_id: sessionId,
        exercise_id: dto.exercise_id,
        order_index: count,
        template_exercise_id: dto.template_exercise_id,
        notes: dto.notes,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
      include: { exercise: true, sets: true },
    });
  }

  async updateSessionExercise(
    sessionId: string,
    exerciseEntryId: string,
    userId: string,
    dto: UpdateSessionExerciseDto,
  ) {
    await this.assertSessionOwner(sessionId, userId);
    const entry = await this.prisma.sessionExercise.findFirst({
      where: { id: exerciseEntryId, session_id: sessionId },
    });
    if (!entry) throw new NotFoundException('训练动作不存在');

    return this.prisma.sessionExercise.update({
      where: { id: exerciseEntryId },
      data: { order_index: dto.order_index, notes: dto.notes },
      include: { exercise: true, sets: true },
    });
  }

  async removeSessionExercise(sessionId: string, exerciseEntryId: string, userId: string) {
    await this.assertSessionOwner(sessionId, userId);
    const entry = await this.prisma.sessionExercise.findFirst({
      where: { id: exerciseEntryId, session_id: sessionId },
    });
    if (!entry) throw new NotFoundException('训练动作不存在');
    await this.prisma.sessionExercise.delete({ where: { id: exerciseEntryId } });
    return { deleted: true };
  }

  // ── Sets (核心高频写入) ────────────────────────────────────────────────────

  async createSet(sessionId: string, exerciseEntryId: string, userId: string, dto: CreateSetEntryDto) {
    // Validate ownership
    const se = await this.prisma.sessionExercise.findFirst({
      where: { id: exerciseEntryId, session_id: sessionId },
      include: { session: { select: { user_id: true, session_date: true } } },
    });
    if (!se) throw new NotFoundException('训练动作不存在');
    if (se.session.user_id !== userId) throw new NotFoundException('训练动作不存在');

    // Idempotency
    const existing = await this.prisma.setEntry.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return { set: existing, prs_broken: [] };

    const set = await this.prisma.setEntry.create({
      data: {
        session_exercise_id: exerciseEntryId,
        user_id: userId,
        exercise_id: se.exercise_id,
        session_date: se.session.session_date,
        set_index: dto.set_index,
        set_type: dto.set_type,
        weight_kg: dto.weight_kg,
        reps: dto.reps,
        duration_seconds: dto.duration_seconds,
        distance_m: dto.distance_m,
        rir: dto.rir,
        rpe: dto.rpe,
        tempo: dto.tempo,
        rest_seconds: dto.rest_seconds,
        is_failure: dto.is_failure ?? false,
        is_warmup: dto.is_warmup ?? false,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });

    // Update LastValueCache
    await this.updateLastValueCache(userId, se.exercise_id, dto.set_index, set, new Date(dto.client_ts));

    // PR detection
    const prs_broken = await this.prService.detectAndUpdate({
      id: set.id,
      user_id: userId,
      exercise_id: se.exercise_id,
      session_date: se.session.session_date,
      session_exercise_id: exerciseEntryId,
      set_type: dto.set_type,
      weight_kg: dto.weight_kg ?? null,
      reps: dto.reps ?? null,
    });

    return { set, prs_broken };
  }

  private async updateLastValueCache(
    userId: string,
    exerciseId: string,
    setIndex: number,
    set: { weight_kg: unknown; reps: unknown; rir: unknown; rpe: unknown; set_type: unknown },
    clientTs: Date,
  ) {
    const key = `${exerciseId}:${setIndex}`;
    const value = {
      set_type: set.set_type,
      weight_kg: set.weight_kg,
      reps: set.reps,
      rir: set.rir,
      rpe: set.rpe,
    } as unknown as Prisma.InputJsonValue;

    // Only update if newer than existing (防乱序回放)
    const existing = await this.prisma.lastValueCache.findUnique({
      where: { user_id_domain_key: { user_id: userId, domain: 'SET', key } },
    });

    if (existing && existing.occurred_at >= clientTs) return;

    await this.prisma.lastValueCache.upsert({
      where: { user_id_domain_key: { user_id: userId, domain: 'SET', key } },
      create: { user_id: userId, domain: 'SET', key, value, occurred_at: clientTs },
      update: { value, occurred_at: clientTs },
    });
  }

  async updateSet(setId: string, userId: string, dto: UpdateSetEntryDto) {
    const set = await this.prisma.setEntry.findFirst({
      where: { id: setId, user_id: userId, deleted_at: null },
    });
    if (!set) throw new NotFoundException('训练组不存在');

    return this.prisma.setEntry.update({
      where: { id: setId },
      data: {
        set_type: dto.set_type,
        weight_kg: dto.weight_kg,
        reps: dto.reps,
        duration_seconds: dto.duration_seconds,
        distance_m: dto.distance_m,
        rir: dto.rir,
        rpe: dto.rpe,
        tempo: dto.tempo,
        rest_seconds: dto.rest_seconds,
        is_failure: dto.is_failure,
        is_warmup: dto.is_warmup,
      },
    });
  }

  async deleteSet(setId: string, userId: string) {
    const set = await this.prisma.setEntry.findFirst({
      where: { id: setId, user_id: userId, deleted_at: null },
    });
    if (!set) throw new NotFoundException('训练组不存在');
    await this.prisma.setEntry.update({ where: { id: setId }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async batchSets(userId: string, dto: BatchSetsDto) {
    const results = await Promise.all(
      dto.operations.map(async (op) => {
        try {
          const se = await this.prisma.sessionExercise.findFirst({
            where: { id: op.session_exercise_id },
            include: { session: { select: { id: true, user_id: true } } },
          });
          if (!se || se.session.user_id !== userId) {
            return { client_op_id: op.client_op_id, status: 'error', error: 'NOT_FOUND' };
          }
          const result = await this.createSet(
            se.session.id,
            op.session_exercise_id,
            userId,
            op.data,
          );
          return { client_op_id: op.client_op_id, status: 'success', data: result };
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'UNKNOWN';
          return { client_op_id: op.client_op_id, status: 'error', error: msg };
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === 'success').length;
    return { total: results.length, succeeded, results };
  }

  // ── PR & History ───────────────────────────────────────────────────────────

  async getExerciseHistory(userId: string, exerciseId: string, limit = 10) {
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        exercises: { some: { exercise_id: exerciseId } },
      },
      include: {
        exercises: {
          where: { exercise_id: exerciseId },
          include: {
            sets: { where: { deleted_at: null }, orderBy: { set_index: 'asc' } },
          },
        },
      },
      orderBy: { session_date: 'desc' },
      take: limit,
    });

    return sessions.map((s) => ({
      session_id: s.id,
      session_date: s.session_date,
      sets: s.exercises.flatMap((e) => e.sets),
    }));
  }

  async getExercisePrs(userId: string, exerciseId: string) {
    return this.prisma.personalRecord.findMany({
      where: { user_id: userId, exercise_id: exerciseId },
      orderBy: { record_type: 'asc' },
    });
  }

  async getRecentPrs(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    return this.prisma.personalRecord.findMany({
      where: { user_id: userId, achieved_at: { gte: since } },
      include: {
        exercise: { select: { id: true, name_zh: true, name_en: true } },
      },
      orderBy: { achieved_at: 'desc' },
      take: 50,
    });
  }

  // ── V1 Compat: flat workout CRUD ──────────────────────────────────────────

  async listWorkoutsV1(
    userId: string,
    query: { page?: number; limit?: number; date?: string; workout_type?: string },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (query.date) where.workout_date = new Date(query.date);
    if (query.workout_type) where.workout_type = query.workout_type;

    const [data, total] = await Promise.all([
      this.prisma.workoutV1.findMany({
        where,
        skip,
        take: limit,
        orderBy: { workout_date: 'desc' },
      }),
      this.prisma.workoutV1.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createWorkoutV1(userId: string, dto: Record<string, unknown>) {
    return this.prisma.workoutV1.create({
      data: {
        user_id: userId,
        workout_type: (dto.workout_type as string) ?? 'STRENGTH',
        exercise_name: dto.exercise_name as string,
        duration_minutes: dto.duration_minutes as number | undefined,
        calories_burned: dto.calories_burned as number | undefined,
        intensity: dto.intensity as string | undefined,
        sets: dto.sets as number | undefined,
        reps: dto.reps as number | undefined,
        weight: dto.weight as number | undefined,
        notes: dto.notes as string | undefined,
        workout_date: new Date((dto.workout_date as string) ?? new Date().toISOString().split('T')[0]),
        workout_time: dto.workout_time as string | undefined,
      },
    });
  }

  async updateWorkoutV1(id: string, userId: string, dto: Record<string, unknown>) {
    const existing = await this.prisma.workoutV1.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('训练记录不存在');

    const { workout_date, ...rest } = dto;
    return this.prisma.workoutV1.update({
      where: { id },
      data: {
        ...(rest as object),
        ...(workout_date ? { workout_date: new Date(workout_date as string) } : {}),
      },
    });
  }

  async deleteWorkoutV1(id: string, userId: string) {
    const existing = await this.prisma.workoutV1.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('训练记录不存在');
    await this.prisma.workoutV1.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async assertSessionOwner(sessionId: string, userId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, user_id: userId, deleted_at: null },
    });
    if (!session) throw new NotFoundException('训练记录不存在');
    return session;
  }
}

// ── Type helpers (avoids deep Prisma generics in method signatures) ───────────

type SessionWithExercises = Awaited<ReturnType<PrismaService['workoutSession']['findFirst']>> & {
  exercises: Array<{
    id: string;
    exercise_id: string;
    template_exercise_id: string | null;
    order_index: number;
    exercise: unknown;
    sets: unknown[];
  }>;
};

type TemplateExerciseWithExercise = {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir: unknown;
  target_rpe: unknown;
  exercise: unknown;
};

type TemplateExInfo = {
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir: unknown;
  target_rpe: unknown;
};
