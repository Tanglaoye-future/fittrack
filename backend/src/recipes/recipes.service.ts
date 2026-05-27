import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { MacroCalculatorService } from '@/common/services/macro-calculator.service';
import { CreateRecipeDto, UpdateRecipeDto, CloneRecipeDto, CreateRecipeIngredientDto } from './dto/recipes.dto';

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly macros: MacroCalculatorService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.recipe.findMany({
      where: { user_id: userId, deleted_at: null },
      include: {
        ingredients: {
          include: { food: true },
          orderBy: { order_index: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: {
        ingredients: {
          include: { food: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!recipe) throw new NotFoundException('配方不存在');
    return recipe;
  }

  async create(dto: CreateRecipeDto, userId: string) {
    const { ingredients = [], ...rest } = dto;
    const cachedMacros = await this.calcRecipeMacros(ingredients);

    return this.prisma.recipe.create({
      data: {
        ...rest,
        user_id: userId,
        serving_count: dto.serving_count ?? 1,
        total_kcal: cachedMacros.kcal,
        total_protein: cachedMacros.protein,
        total_carbs: cachedMacros.carbs,
        total_fat: cachedMacros.fat,
        ingredients: {
          create: ingredients.map((i) => ({
            food_id: i.food_id,
            grams: i.grams,
            order_index: i.order_index,
          })),
        },
      },
      include: {
        ingredients: {
          include: { food: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRecipeDto, userId: string) {
    await this.assertOwner(id, userId);
    const { ingredients, ...rest } = dto;

    let macroData: Record<string, number> = {};
    if (ingredients !== undefined) {
      const cachedMacros = await this.calcRecipeMacros(ingredients);
      macroData = {
        total_kcal: cachedMacros.kcal,
        total_protein: cachedMacros.protein,
        total_carbs: cachedMacros.carbs,
        total_fat: cachedMacros.fat,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      if (ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipe_id: id } });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          ...rest,
          ...macroData,
          ...(ingredients !== undefined && {
            ingredients: {
              create: ingredients.map((i) => ({
                food_id: i.food_id,
                grams: i.grams,
                order_index: i.order_index,
              })),
            },
          }),
        },
        include: {
          ingredients: {
            include: { food: true },
            orderBy: { order_index: 'asc' },
          },
        },
      });
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.recipe.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async clone(id: string, dto: CloneRecipeDto, userId: string) {
    const original = await this.findOne(id, userId);
    return this.create(
      {
        name: dto.name ?? `${original.name}（副本）`,
        description: original.description ?? undefined,
        serving_count: original.serving_count,
        ingredients: original.ingredients.map((i, idx) => ({
          food_id: i.food_id,
          grams: Number(i.grams),
          order_index: i.order_index ?? idx,
        })),
      },
      userId,
    );
  }

  async getMacros(id: string, userId: string) {
    const recipe = await this.findOne(id, userId);
    const perServing =
      recipe.serving_count > 1
        ? {
            kcal: Number(recipe.total_kcal) / recipe.serving_count,
            protein: Number(recipe.total_protein) / recipe.serving_count,
            carbs: Number(recipe.total_carbs) / recipe.serving_count,
            fat: Number(recipe.total_fat) / recipe.serving_count,
          }
        : null;

    return {
      total_kcal: recipe.total_kcal,
      total_protein: recipe.total_protein,
      total_carbs: recipe.total_carbs,
      total_fat: recipe.total_fat,
      serving_count: recipe.serving_count,
      per_serving: perServing,
    };
  }

  private async assertOwner(id: string, userId: string) {
    const recipe = await this.prisma.recipe.findFirst({ where: { id, deleted_at: null } });
    if (!recipe) throw new NotFoundException('配方不存在');
    if (recipe.user_id !== userId) throw new ForbiddenException('无权操作');
    return recipe;
  }

  async calcRecipeMacros(ingredients: Array<Pick<CreateRecipeIngredientDto, 'food_id' | 'grams'>>) {
    if (!ingredients.length) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };

    const foods = await this.prisma.food.findMany({
      where: { id: { in: ingredients.map((i) => i.food_id) } },
    });

    const foodMap = new Map(foods.map((f) => [f.id, f]));
    const macroList = ingredients.map((i) => {
      const food = foodMap.get(i.food_id);
      if (!food) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      return this.macros.calcFromGrams(food, i.grams);
    });

    return this.macros.sumMacros(macroList);
  }
}
