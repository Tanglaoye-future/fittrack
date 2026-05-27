import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  SearchExercisesDto,
  CreateExerciseDto,
  UpdateExerciseDto,
} from './dto/exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: SearchExercisesDto) {
    const { q, muscle, equipment, pattern, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Exercise is a global dict table — no deleted_at, no user_id
    const where: Record<string, unknown> = {};

    if (muscle) where.primary_muscle = muscle;
    if (equipment) where.equipment = equipment;
    if (pattern) where.movement_pattern = pattern;

    if (q) {
      where.OR = [
        { name_zh: { contains: q } },
        { name_en: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_official: 'desc' }, { name_zh: 'asc' }],
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        has_next: skip + items.length < total,
      },
    };
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id },
    });
    if (!exercise) throw new NotFoundException('动作不存在');
    return exercise;
  }

  async findPopular(limit = 10) {
    const rows = await this.prisma.sessionExercise.groupBy({
      by: ['exercise_id'],
      _count: { exercise_id: true },
      orderBy: { _count: { exercise_id: 'desc' } },
      take: limit,
    });

    if (rows.length === 0) {
      return this.prisma.exercise.findMany({
        where: { is_official: true },
        take: limit,
        orderBy: { name_zh: 'asc' },
      });
    }

    const ids = rows.map((r) => r.exercise_id);
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: ids } },
    });

    return ids
      .map((id) => exercises.find((e) => e.id === id))
      .filter(Boolean);
  }

  async create(dto: CreateExerciseDto, userId: string) {
    const exists = await this.prisma.exercise.findFirst({
      where: { name_en: dto.name_en },
    });
    if (exists) throw new ConflictException('英文名称已存在');

    return this.prisma.exercise.create({
      data: {
        name_zh: dto.name_zh,
        name_en: dto.name_en,
        description: dto.description,
        primary_muscle: dto.primary_muscle,
        secondary_muscles: dto.secondary_muscles ?? [],
        equipment: dto.equipment,
        movement_pattern: dto.movement_pattern,
        video_url: dto.video_url,
        thumbnail_url: dto.thumbnail_url,
        is_official: false,
        created_by: userId,
      },
    });
  }

  async update(id: string, dto: UpdateExerciseDto, userId: string) {
    const exercise = await this.prisma.exercise.findFirst({ where: { id } });
    if (!exercise) throw new NotFoundException('动作不存在');
    if (!exercise.is_official && exercise.created_by !== userId) {
      throw new ForbiddenException('无权限修改此动作');
    }

    return this.prisma.exercise.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const exercise = await this.prisma.exercise.findFirst({ where: { id } });
    if (!exercise) throw new NotFoundException('动作不存在');
    if (exercise.is_official) throw new ForbiddenException('官方动作不可删除');
    if (exercise.created_by !== userId) throw new ForbiddenException('无权限删除此动作');

    // Exercise is a global dict — hard delete (no deleted_at field)
    await this.prisma.exercise.delete({ where: { id } });
    return { deleted: true };
  }
}
