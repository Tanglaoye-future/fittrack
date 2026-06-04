import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateTrainingPlanDto,
  UpdateTrainingPlanDto,
  CreateTrainingTemplateDto,
  UpdateTrainingTemplateDto,
  CreateTemplateExerciseDto,
  CloneTrainingPlanDto,
} from './dto/training-plans.dto';
import {
  OFFICIAL_TRAINING_PLANS,
  findOfficialPlanBySlug,
} from './official-plans';

@Injectable()
export class TrainingPlansService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Plans ──────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    return this.prisma.trainingPlan.findMany({
      where: { user_id: userId, deleted_at: null },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findActive(userId: string) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { user_id: userId, is_active: true, deleted_at: null },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
    if (!plan) throw new NotFoundException('暂无激活的训练计划');
    return plan;
  }

  async findOne(id: string, userId: string) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
    if (!plan) throw new NotFoundException('训练计划不存在');
    return plan;
  }

  async create(dto: CreateTrainingPlanDto, userId: string) {
    return this.prisma.trainingPlan.create({
      data: {
        user_id: userId,
        name: dto.name,
        description: dto.description,
        weeks: dto.weeks,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        templates: dto.templates?.length
          ? {
              create: dto.templates.map((t) =>
                this.buildTemplateInput(t),
              ),
            }
          : undefined,
      },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
  }

  private buildTemplateInput(t: CreateTrainingTemplateDto) {
    const now = new Date();
    return {
      name: t.name,
      day_of_week: t.day_of_week,
      estimated_minutes: t.estimated_minutes,
      rest_seconds_default: t.rest_seconds_default ?? 90,
      notes: t.notes,
      exercises: t.exercises?.length
        ? {
            create: t.exercises.map((e, eIdx) => ({
              exercise_id: e.exercise_id,
              order_index: eIdx,
              target_sets: e.target_sets,
              target_reps_min: e.target_reps_min,
              target_reps_max: e.target_reps_max,
              target_rir: e.target_rir,
              target_rpe: e.target_rpe,
              rest_seconds: e.rest_seconds,
              tempo: e.tempo,
              notes: e.notes,
              client_op_id: randomUUID(),
              client_ts: now,
            })),
          }
        : undefined,
    };
  }

  async update(id: string, dto: UpdateTrainingPlanDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.trainingPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        weeks: dto.weeks,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
      include: {
        templates: { include: { exercises: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.trainingPlan.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
    return { deleted: true };
  }

  async activate(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.trainingPlan.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });
    return this.prisma.trainingPlan.update({
      where: { id },
      data: { is_active: true },
      include: {
        templates: { include: { exercises: true } },
      },
    });
  }

  async clone(id: string, dto: CloneTrainingPlanDto, userId: string) {
    const original = await this.prisma.trainingPlan.findFirst({
      where: { id, deleted_at: null },
      include: {
        templates: { include: { exercises: true } },
      },
    });
    if (!original) throw new NotFoundException('训练计划不存在');

    const now = new Date();
    return this.prisma.trainingPlan.create({
      data: {
        user_id: userId,
        name: dto.name ?? `${original.name}（副本）`,
        description: original.description,
        weeks: original.weeks,
        templates: {
          create: original.templates.map((t) => ({
            name: t.name,
            day_of_week: t.day_of_week,
            estimated_minutes: t.estimated_minutes,
            rest_seconds_default: t.rest_seconds_default,
            notes: t.notes,
            exercises: {
              create: t.exercises.map((e) => ({
                exercise_id: e.exercise_id,
                order_index: e.order_index,
                target_sets: e.target_sets,
                target_reps_min: e.target_reps_min,
                target_reps_max: e.target_reps_max,
                target_rir: e.target_rir,
                target_rpe: e.target_rpe,
                rest_seconds: e.rest_seconds,
                tempo: e.tempo,
                notes: e.notes,
                client_op_id: randomUUID(),
                client_ts: now,
              })),
            },
          })),
        },
      },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  async addTemplate(planId: string, dto: CreateTrainingTemplateDto, userId: string) {
    await this.assertOwner(planId, userId);
    return this.prisma.trainingTemplate.create({
      data: {
        plan_id: planId,
        ...this.buildTemplateInput(dto),
      },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async updateTemplate(
    planId: string,
    templateId: string,
    dto: UpdateTrainingTemplateDto,
    userId: string,
  ) {
    await this.assertOwner(planId, userId);
    const tmpl = await this.prisma.trainingTemplate.findFirst({
      where: { id: templateId, plan_id: planId },
    });
    if (!tmpl) throw new NotFoundException('模板不存在');

    return this.prisma.trainingTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        day_of_week: dto.day_of_week,
        estimated_minutes: dto.estimated_minutes,
        rest_seconds_default: dto.rest_seconds_default,
        notes: dto.notes,
      },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async removeTemplate(planId: string, templateId: string, userId: string) {
    await this.assertOwner(planId, userId);
    const tmpl = await this.prisma.trainingTemplate.findFirst({
      where: { id: templateId, plan_id: planId },
    });
    if (!tmpl) throw new NotFoundException('模板不存在');
    await this.prisma.trainingTemplate.delete({ where: { id: templateId } });
    return { deleted: true };
  }

  // ── Template Exercises ─────────────────────────────────────────────────────

  async addTemplateExercise(
    planId: string,
    templateId: string,
    dto: CreateTemplateExerciseDto,
    userId: string,
  ) {
    await this.assertOwner(planId, userId);
    const tmpl = await this.prisma.trainingTemplate.findFirst({
      where: { id: templateId, plan_id: planId },
    });
    if (!tmpl) throw new NotFoundException('模板不存在');

    const count = await this.prisma.templateExercise.count({
      where: { template_id: templateId },
    });

    return this.prisma.templateExercise.create({
      data: {
        template_id: templateId,
        exercise_id: dto.exercise_id,
        order_index: count,
        target_sets: dto.target_sets,
        target_reps_min: dto.target_reps_min,
        target_reps_max: dto.target_reps_max,
        target_rir: dto.target_rir,
        target_rpe: dto.target_rpe,
        rest_seconds: dto.rest_seconds,
        tempo: dto.tempo,
        notes: dto.notes,
        client_op_id: randomUUID(),
        client_ts: new Date(),
      },
      include: { exercise: true },
    });
  }

  async removeTemplateExercise(
    planId: string,
    templateId: string,
    exerciseEntryId: string,
    userId: string,
  ) {
    await this.assertOwner(planId, userId);
    const entry = await this.prisma.templateExercise.findFirst({
      where: { id: exerciseEntryId, template_id: templateId },
    });
    if (!entry) throw new NotFoundException('模板动作不存在');
    await this.prisma.templateExercise.delete({ where: { id: exerciseEntryId } });
    return { deleted: true };
  }

  // ── Official templates (预设库) ────────────────────────────────────────────

  /**
   * 返回官方训练计划元数据（已 join Exercise 表回填 name_zh / id），
   * 前端无需再发请求解析动作。
   */
  async findOfficialTemplates() {
    const allNamesEn = Array.from(
      new Set(
        OFFICIAL_TRAINING_PLANS.flatMap((p) =>
          p.templates.flatMap((t) => t.exercises.map((e) => e.exercise_name_en)),
        ),
      ),
    );
    const exs = await this.prisma.exercise.findMany({
      where: { name_en: { in: allNamesEn } },
      select: { id: true, name_en: true, name_zh: true, primary_muscle: true },
    });
    const byEn = new Map(exs.map((e) => [e.name_en, e]));

    return OFFICIAL_TRAINING_PLANS.map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      weeks: p.weeks,
      phase_tag: p.phase_tag,
      day_count: p.templates.length,
      total_exercises: p.templates.reduce((sum, t) => sum + t.exercises.length, 0),
      templates: p.templates.map((t) => ({
        name: t.name,
        day_of_week: t.day_of_week,
        estimated_minutes: t.estimated_minutes,
        rest_seconds_default: t.rest_seconds_default,
        notes: t.notes,
        exercises: t.exercises.map((e) => {
          const resolved = byEn.get(e.exercise_name_en);
          return {
            exercise_id: resolved?.id ?? null,
            exercise_name_zh: resolved?.name_zh ?? e.exercise_name_en,
            exercise_name_en: e.exercise_name_en,
            primary_muscle: resolved?.primary_muscle ?? null,
            target_sets: e.target_sets,
            target_reps_min: e.target_reps_min,
            target_reps_max: e.target_reps_max,
            target_rir: e.target_rir,
            target_rpe: e.target_rpe,
            rest_seconds: e.rest_seconds,
            tempo: e.tempo,
            notes: e.notes,
          };
        }),
      })),
    }));
  }

  /**
   * 从官方预设克隆出归属当前用户的训练计划。
   * - 强制幂等：用户提供 `client_op_id`；同 key 重放返回已创建计划（SCHEMA §0.1）
   * - 解析 Exercise.name_en → exercise_id，并把中文名等元数据带回
   * - 缺动作时返回中文提示（避免暴露内部 slug 给运动员）
   * - 不自动激活；用户走标准 activate 流程
   */
  async cloneFromOfficial(
    slug: string,
    userId: string,
    clientOpId: string,
    customName?: string,
  ) {
    const official = findOfficialPlanBySlug(slug);
    if (!official) throw new NotFoundException(`官方计划 ${slug} 不存在`);

    // 幂等校验：用户 client_op_id 落在首条 TemplateExercise 上，重放即命中
    const existing = await this.prisma.templateExercise.findUnique({
      where: { client_op_id: clientOpId },
      include: {
        template: {
          include: {
            plan: {
              include: {
                templates: {
                  include: { exercises: { include: { exercise: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (existing?.template?.plan?.user_id === userId) {
      return existing.template.plan;
    }

    const namesEn = Array.from(
      new Set(
        official.templates.flatMap((t) => t.exercises.map((e) => e.exercise_name_en)),
      ),
    );
    const exercises = await this.prisma.exercise.findMany({
      where: { name_en: { in: namesEn } },
    });
    const byName = new Map(exercises.map((ex) => [ex.name_en, ex.id]));
    const missing = namesEn.filter((n) => !byName.has(n));
    if (missing.length) {
      throw new BadRequestException(
        `官方动作库未就绪（缺 ${missing.length} 项），请联系管理员重跑动作种子`,
      );
    }

    const now = new Date();
    let isFirstWrite = true; // 第一条 TemplateExercise 拿用户的 client_op_id
    return this.prisma.trainingPlan.create({
      data: {
        user_id: userId,
        name: customName ?? official.name,
        description: official.description,
        weeks: official.weeks,
        templates: {
          create: official.templates.map((t) => ({
            name: t.name,
            day_of_week: t.day_of_week,
            estimated_minutes: t.estimated_minutes,
            rest_seconds_default: t.rest_seconds_default,
            notes: t.notes,
            exercises: {
              create: t.exercises.map((e, idx) => {
                const opId = isFirstWrite ? clientOpId : randomUUID();
                isFirstWrite = false;
                return {
                  exercise_id: byName.get(e.exercise_name_en)!,
                  order_index: idx,
                  target_sets: e.target_sets,
                  target_reps_min: e.target_reps_min,
                  target_reps_max: e.target_reps_max,
                  target_rir: e.target_rir,
                  target_rpe: e.target_rpe,
                  rest_seconds: e.rest_seconds,
                  tempo: e.tempo,
                  notes: e.notes,
                  client_op_id: opId,
                  client_ts: now,
                };
              }),
            },
          })),
        },
      },
      include: {
        templates: {
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async assertOwner(planId: string, userId: string) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: planId, user_id: userId, deleted_at: null },
    });
    if (!plan) throw new NotFoundException('训练计划不存在');
    return plan;
  }
}
