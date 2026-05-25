import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateMealDto, UpdateMealDto, QueryMealDto } from './dto/meals.dto';

@Injectable()
export class MealsService {
  private readonly logger = new Logger(MealsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMealDto) {
    const meal = await this.prisma.meal.create({
      data: {
        user_id: userId,
        meal_type: dto.meal_type as any,
        food_name: dto.food_name,
        description: dto.description,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        portion_size: dto.portion_size,
        meal_date: new Date(dto.meal_date),
        meal_time: dto.meal_time ? new Date(`1970-01-01T${dto.meal_time}:00`) : null,
      },
    });

    this.logger.log(`用户 ${userId} 创建了饮食记录: ${meal.id}`);
    return meal;
  }

  async findAll(userId: string, query: QueryMealDto) {
    const { date, meal_type, page = 1, limit = 20 } = query;
    const where: any = { user_id: userId, deleted_at: null };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.meal_date = { gte: start, lte: end };
    }

    if (meal_type) {
      where.meal_type = meal_type;
    }

    const [data, total] = await Promise.all([
      this.prisma.meal.findMany({
        where,
        orderBy: { meal_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.meal.count({ where }),
    ]);

    return { total, page, limit, data };
  }

  async findOne(userId: string, id: string) {
    const meal = await this.prisma.meal.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });

    if (!meal) {
      throw new NotFoundException('饮食记录不存在');
    }

    return meal;
  }

  async update(userId: string, id: string, dto: UpdateMealDto) {
    await this.findOne(userId, id);

    const data: any = {};
    if (dto.meal_type) data.meal_type = dto.meal_type;
    if (dto.food_name) data.food_name = dto.food_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.calories !== undefined) data.calories = dto.calories;
    if (dto.protein !== undefined) data.protein = dto.protein;
    if (dto.carbs !== undefined) data.carbs = dto.carbs;
    if (dto.fat !== undefined) data.fat = dto.fat;
    if (dto.portion_size !== undefined) data.portion_size = dto.portion_size;
    if (dto.meal_date) data.meal_date = new Date(dto.meal_date);
    if (dto.meal_time) data.meal_time = new Date(`1970-01-01T${dto.meal_time}:00`);

    return this.prisma.meal.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.meal.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
