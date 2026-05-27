import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SearchFoodsDto, CreateFoodDto, UpdateFoodDto } from './dto/foods.dto';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: SearchFoodsDto) {
    const { q, category, barcode, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (barcode) where.barcode = barcode;
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { name_zh: { contains: q, mode: 'insensitive' } },
        { name_en: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.food.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name_zh: 'asc' },
      }),
      this.prisma.food.count({ where }),
    ]);

    return { items, meta: { total, page, limit, has_next: skip + items.length < total } };
  }

  async findOne(id: string) {
    const food = await this.prisma.food.findUnique({ where: { id } });
    if (!food) throw new NotFoundException('食材不存在');
    return food;
  }

  async findByBarcode(barcode: string) {
    const food = await this.prisma.food.findUnique({ where: { barcode } });
    if (!food) throw new NotFoundException('未找到条码对应食材');
    return food;
  }

  async findRecent(userId: string, limit = 10) {
    const items = await this.prisma.mealItem.findMany({
      where: {
        meal_log: { user_id: userId, deleted_at: null },
        food_id: { not: null },
        deleted_at: null,
      },
      select: { food_id: true },
      orderBy: { created_at: 'desc' },
      distinct: ['food_id'],
      take: limit,
    });

    const foodIds = items.map((i) => i.food_id!).filter(Boolean);
    if (!foodIds.length) return [];

    return this.prisma.food.findMany({ where: { id: { in: foodIds } } });
  }

  async findFavorites(userId: string) {
    const favs = await this.prisma.foodFavorite.findMany({
      where: { user_id: userId },
      include: { food: true },
      orderBy: { created_at: 'desc' },
    });
    return favs.map((f) => f.food);
  }

  async addFavorite(id: string, userId: string) {
    await this.findOne(id);
    await this.prisma.foodFavorite.upsert({
      where: { user_id_food_id: { user_id: userId, food_id: id } },
      create: { user_id: userId, food_id: id },
      update: {},
    });
    return { favorited: true };
  }

  async removeFavorite(id: string, userId: string) {
    await this.prisma.foodFavorite.deleteMany({
      where: { user_id: userId, food_id: id },
    });
    return { favorited: false };
  }

  async create(dto: CreateFoodDto, userId: string) {
    if (dto.barcode) {
      const existing = await this.prisma.food.findUnique({ where: { barcode: dto.barcode } });
      if (existing) throw new ConflictException('该条码已存在');
    }

    return this.prisma.food.create({
      data: {
        ...dto,
        is_official: false,
        created_by: userId,
        verified: false,
      },
    });
  }

  async update(id: string, dto: UpdateFoodDto, userId: string) {
    const food = await this.findOne(id);
    if (food.is_official) throw new ConflictException('官方食材不可修改');
    if (food.created_by !== userId) throw new ConflictException('无权修改他人食材');

    return this.prisma.food.update({ where: { id }, data: dto });
  }

  async scanBarcode(barcode: string) {
    const food = await this.prisma.food.findUnique({ where: { barcode } });
    return { found: !!food, food: food ?? null };
  }
}
