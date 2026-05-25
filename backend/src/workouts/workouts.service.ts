import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateWorkoutDto, UpdateWorkoutDto, QueryWorkoutDto } from './dto/workouts.dto';

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkoutDto) {
    const workout = await this.prisma.workout.create({
      data: {
        user_id: userId,
        workout_type: dto.workout_type as any,
        exercise_name: dto.exercise_name,
        duration_minutes: dto.duration_minutes,
        calories_burned: dto.calories_burned,
        intensity: dto.intensity as any,
        sets: dto.sets,
        reps: dto.reps,
        weight: dto.weight,
        notes: dto.notes,
        workout_date: new Date(dto.workout_date),
        workout_time: dto.workout_time ? new Date(`1970-01-01T${dto.workout_time}:00`) : null,
      },
    });

    this.logger.log(`用户 ${userId} 创建了训练记录: ${workout.id}`);
    return workout;
  }

  async findAll(userId: string, query: QueryWorkoutDto) {
    const { date, workout_type, page = 1, limit = 20 } = query;
    const where: any = { user_id: userId, deleted_at: null };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.workout_date = { gte: start, lte: end };
    }

    if (workout_type) {
      where.workout_type = workout_type;
    }

    const [data, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        orderBy: { workout_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.workout.count({ where }),
    ]);

    return { total, page, limit, data };
  }

  async findOne(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });

    if (!workout) {
      throw new NotFoundException('训练记录不存在');
    }

    return workout;
  }

  async update(userId: string, id: string, dto: UpdateWorkoutDto) {
    await this.findOne(userId, id);

    const data: any = {};
    if (dto.workout_type) data.workout_type = dto.workout_type;
    if (dto.exercise_name) data.exercise_name = dto.exercise_name;
    if (dto.duration_minutes !== undefined) data.duration_minutes = dto.duration_minutes;
    if (dto.calories_burned !== undefined) data.calories_burned = dto.calories_burned;
    if (dto.intensity) data.intensity = dto.intensity;
    if (dto.sets !== undefined) data.sets = dto.sets;
    if (dto.reps !== undefined) data.reps = dto.reps;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.workout_date) data.workout_date = new Date(dto.workout_date);
    if (dto.workout_time) data.workout_time = new Date(`1970-01-01T${dto.workout_time}:00`);

    return this.prisma.workout.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.workout.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
