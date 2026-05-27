import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { MacroCalculatorService, MacroResult } from '@/common/services/macro-calculator.service';
import {
  AddMealItemDto,
  CreateMealLogDto,
  CreateMealPlanTemplateDto,
  ListMealsDto,
  QuickLogDto,
  UpdateMealItemDto,
  UpdateMealLogDto,
  UpdateMealPlanTemplateDto,
} from './dto/meals.dto';

@Injectable()
export class MealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly macros: MacroCalculatorService,
  ) {}

  // ── Meal logs ──────────────────────────────────────────────────────────────

  async listMeals(userId: string, dto: ListMealsDto) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (dto.date) where.meal_date = new Date(dto.date);

    return this.prisma.mealLog.findMany({
      where,
      include: { items: { where: { deleted_at: null } } },
      orderBy: { consumed_at: 'asc' },
    });
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [meals, macroTarget] = await Promise.all([
      this.prisma.mealLog.findMany({
        where: { user_id: userId, meal_date: today, deleted_at: null },
        include: { items: { where: { deleted_at: null } } },
        orderBy: { consumed_at: 'asc' },
      }),
      this.prisma.macroTarget.findUnique({
        where: { user_id_target_date: { user_id: userId, target_date: today } },
      }),
    ]);

    const achieved = meals.reduce(
      (acc, meal) => ({
        kcal: acc.kcal + Number(meal.total_kcal ?? 0),
        protein: acc.protein + Number(meal.total_protein ?? 0),
        carbs: acc.carbs + Number(meal.total_carbs ?? 0),
        fat: acc.fat + Number(meal.total_fat ?? 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { meals, macro_target: macroTarget, achieved };
  }

  async getPlannedToday(userId: string) {
    const template = await this.prisma.mealPlanTemplate.findFirst({
      where: { user_id: userId, is_active: true, deleted_at: null },
      include: {
        scheduled_meals: {
          include: {
            ingredients: { include: { food: true } },
            recipe: {
              include: {
                ingredients: { include: { food: true } },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!template) return { template: null, scheduled_meals: [] };
    return { template, scheduled_meals: template.scheduled_meals };
  }

  async createMealLog(userId: string, dto: CreateMealLogDto) {
    const existing = await this.prisma.mealLog.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const items = dto.items ?? [];
    const snapshots = await Promise.all(items.map((item) => this.calcItemSnapshot(item)));
    const totalMacros = this.macros.sumMacros(snapshots.map((s) => s.macro));

    const mealDate = new Date(dto.consumed_at);
    mealDate.setHours(0, 0, 0, 0);

    return this.prisma.mealLog.create({
      data: {
        user_id: userId,
        meal_slot: dto.meal_slot as never,
        consumed_at: new Date(dto.consumed_at),
        meal_date: mealDate,
        notes: dto.notes,
        is_planned: false,
        total_kcal: totalMacros.kcal,
        total_protein: totalMacros.protein,
        total_carbs: totalMacros.carbs,
        total_fat: totalMacros.fat,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
        items: {
          create: items.map((item, idx) => ({
            food_id: item.food_id,
            recipe_id: item.recipe_id,
            grams: item.grams,
            snapshot_kcal: snapshots[idx].macro.kcal,
            snapshot_protein: snapshots[idx].macro.protein,
            snapshot_carbs: snapshots[idx].macro.carbs,
            snapshot_fat: snapshots[idx].macro.fat,
            client_op_id: item.client_op_id,
            client_ts: new Date(item.client_ts),
          })),
        },
      },
      include: { items: { where: { deleted_at: null } } },
    });
  }

  async findOne(id: string, userId: string) {
    const meal = await this.prisma.mealLog.findFirst({
      where: { id, user_id: userId, deleted_at: null },
      include: { items: { where: { deleted_at: null } } },
    });
    if (!meal) throw new NotFoundException('餐次不存在');
    return meal;
  }

  async updateMealLog(id: string, userId: string, dto: UpdateMealLogDto) {
    await this.assertOwner(id, userId);
    return this.prisma.mealLog.update({
      where: { id },
      data: {
        ...(dto.meal_slot && { meal_slot: dto.meal_slot as never }),
        ...(dto.consumed_at && { consumed_at: new Date(dto.consumed_at) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteMealLog(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.mealLog.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async addItem(mealLogId: string, userId: string, dto: AddMealItemDto) {
    await this.assertOwner(mealLogId, userId);

    if (!dto.food_id && !dto.recipe_id) {
      throw new BadRequestException('food_id 或 recipe_id 必须提供一个');
    }
    if (dto.food_id && dto.recipe_id) {
      throw new BadRequestException('food_id 与 recipe_id 只能提供一个');
    }

    const existing = await this.prisma.mealItem.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const { macro } = await this.calcItemSnapshot(dto);
    const item = await this.prisma.mealItem.create({
      data: {
        meal_log_id: mealLogId,
        food_id: dto.food_id,
        recipe_id: dto.recipe_id,
        grams: dto.grams,
        snapshot_kcal: macro.kcal,
        snapshot_protein: macro.protein,
        snapshot_carbs: macro.carbs,
        snapshot_fat: macro.fat,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });

    await this.recalcMealTotals(mealLogId);
    return item;
  }

  async updateItem(itemId: string, userId: string, dto: UpdateMealItemDto) {
    const item = await this.prisma.mealItem.findFirst({
      where: { id: itemId, deleted_at: null },
      include: { meal_log: true },
    });
    if (!item || item.meal_log.user_id !== userId) throw new NotFoundException('食材项不存在');

    const { macro } = await this.calcItemSnapshot({ ...item, grams: dto.grams });
    await this.prisma.mealItem.update({
      where: { id: itemId },
      data: {
        grams: dto.grams,
        snapshot_kcal: macro.kcal,
        snapshot_protein: macro.protein,
        snapshot_carbs: macro.carbs,
        snapshot_fat: macro.fat,
      },
    });

    await this.recalcMealTotals(item.meal_log_id);
    return this.prisma.mealItem.findUnique({ where: { id: itemId } });
  }

  async deleteItem(itemId: string, userId: string) {
    const item = await this.prisma.mealItem.findFirst({
      where: { id: itemId, deleted_at: null },
      include: { meal_log: true },
    });
    if (!item || item.meal_log.user_id !== userId) throw new NotFoundException('食材项不存在');

    await this.prisma.mealItem.update({ where: { id: itemId }, data: { deleted_at: new Date() } });
    await this.recalcMealTotals(item.meal_log_id);
    return { deleted: true };
  }

  async quickLog(userId: string, dto: QuickLogDto) {
    const existing = await this.prisma.mealLog.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    const scheduledMeal = await this.prisma.scheduledMeal.findFirst({
      where: { id: dto.scheduled_meal_id },
      include: {
        ingredients: { include: { food: true } },
        recipe: { include: { ingredients: { include: { food: true } } } },
      },
    });
    if (!scheduledMeal) throw new NotFoundException('计划餐不存在');

    const mealDate = new Date(dto.consumed_at);
    mealDate.setHours(0, 0, 0, 0);

    type ItemDraft = {
      food_id?: string;
      recipe_id?: string;
      grams: number;
      macro: MacroResult;
      client_op_id: string;
    };

    const itemDrafts: ItemDraft[] = [];

    if (scheduledMeal.recipe_id && scheduledMeal.recipe) {
      const recipeTotal = scheduledMeal.recipe.ingredients.reduce<MacroResult>(
        (acc, ri) => {
          const m = this.macros.calcFromGrams(ri.food, Number(ri.grams));
          return {
            kcal: acc.kcal + m.kcal,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fat: acc.fat + m.fat,
          };
        },
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      );
      itemDrafts.push({
        recipe_id: scheduledMeal.recipe_id,
        grams: 100,
        macro: recipeTotal,
        client_op_id: `${dto.client_op_id}:0`,
      });
    } else {
      scheduledMeal.ingredients.forEach((ing, idx) => {
        const macro = this.macros.calcFromGrams(ing.food, Number(ing.grams));
        itemDrafts.push({
          food_id: ing.food_id,
          grams: Number(ing.grams),
          macro,
          client_op_id: `${dto.client_op_id}:${idx}`,
        });
      });
    }

    const totalMacros = this.macros.sumMacros(itemDrafts.map((i) => i.macro));

    return this.prisma.mealLog.create({
      data: {
        user_id: userId,
        meal_slot: scheduledMeal.meal_slot,
        consumed_at: new Date(dto.consumed_at),
        meal_date: mealDate,
        is_planned: true,
        total_kcal: totalMacros.kcal,
        total_protein: totalMacros.protein,
        total_carbs: totalMacros.carbs,
        total_fat: totalMacros.fat,
        client_op_id: dto.client_op_id,
        client_ts: new Date(),
        items: {
          create: itemDrafts.map((d) => ({
            food_id: d.food_id,
            recipe_id: d.recipe_id,
            grams: d.grams,
            snapshot_kcal: d.macro.kcal,
            snapshot_protein: d.macro.protein,
            snapshot_carbs: d.macro.carbs,
            snapshot_fat: d.macro.fat,
            client_op_id: d.client_op_id,
            client_ts: new Date(),
          })),
        },
      },
      include: { items: true },
    });
  }

  // ── Plan templates ─────────────────────────────────────────────────────────

  async listPlanTemplates(userId: string) {
    return this.prisma.mealPlanTemplate.findMany({
      where: { user_id: userId, deleted_at: null },
      include: { scheduled_meals: { orderBy: { order_index: 'asc' } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async createPlanTemplate(userId: string, dto: CreateMealPlanTemplateDto) {
    const existing = await this.prisma.mealPlanTemplate.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.mealPlanTemplate.create({
      data: {
        user_id: userId,
        name: dto.name,
        prep_cycle_id: dto.prep_cycle_id,
        total_kcal: dto.total_kcal,
        total_protein_g: dto.total_protein_g,
        total_carbs_g: dto.total_carbs_g,
        total_fat_g: dto.total_fat_g,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
        scheduled_meals: {
          create: (dto.scheduled_meals ?? []).map((sm) => ({
            order_index: sm.order_index,
            meal_slot: sm.meal_slot as never,
            target_time: sm.target_time,
            target_kcal: sm.target_kcal,
            target_protein_g: sm.target_protein_g,
            target_carbs_g: sm.target_carbs_g,
            target_fat_g: sm.target_fat_g,
            recipe_id: sm.recipe_id,
            notes: sm.notes,
            ...(sm.ingredients?.length && {
              ingredients: {
                create: sm.ingredients.map((i) => ({
                  food_id: i.food_id,
                  grams: i.grams,
                })),
              },
            }),
          })),
        },
      },
      include: { scheduled_meals: { orderBy: { order_index: 'asc' } } },
    });
  }

  async updatePlanTemplate(id: string, userId: string, dto: UpdateMealPlanTemplateDto) {
    await this.assertTemplateOwner(id, userId);
    return this.prisma.mealPlanTemplate.update({ where: { id }, data: dto });
  }

  async activatePlanTemplate(id: string, userId: string) {
    await this.assertTemplateOwner(id, userId);
    await this.prisma.mealPlanTemplate.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });
    await this.prisma.mealPlanTemplate.update({ where: { id }, data: { is_active: true } });
    return { activated: true };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async assertOwner(mealLogId: string, userId: string) {
    const meal = await this.prisma.mealLog.findFirst({
      where: { id: mealLogId, deleted_at: null },
    });
    if (!meal || meal.user_id !== userId) throw new NotFoundException('餐次不存在');
    return meal;
  }

  private async assertTemplateOwner(id: string, userId: string) {
    const tmpl = await this.prisma.mealPlanTemplate.findFirst({
      where: { id, deleted_at: null },
    });
    if (!tmpl || tmpl.user_id !== userId) throw new NotFoundException('餐单模板不存在');
    return tmpl;
  }

  private async calcItemSnapshot(item: {
    food_id?: string | null;
    recipe_id?: string | null;
    grams: number | string;
  }): Promise<{ macro: MacroResult }> {
    const grams = Number(item.grams);

    if (item.food_id) {
      const food = await this.prisma.food.findUnique({ where: { id: item.food_id } });
      if (!food) return { macro: { kcal: 0, protein: 0, carbs: 0, fat: 0 } };
      return { macro: this.macros.calcFromGrams(food, grams) };
    }

    if (item.recipe_id) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: item.recipe_id },
        include: { ingredients: { include: { food: true } } },
      });
      if (!recipe) return { macro: { kcal: 0, protein: 0, carbs: 0, fat: 0 } };
      const totalGrams =
        recipe.ingredients.reduce((sum, ri) => sum + Number(ri.grams), 0) || 100;
      const factor = grams / totalGrams;
      return {
        macro: {
          kcal: Number(recipe.total_kcal ?? 0) * factor,
          protein: Number(recipe.total_protein ?? 0) * factor,
          carbs: Number(recipe.total_carbs ?? 0) * factor,
          fat: Number(recipe.total_fat ?? 0) * factor,
        },
      };
    }

    return { macro: { kcal: 0, protein: 0, carbs: 0, fat: 0 } };
  }

  private async recalcMealTotals(mealLogId: string) {
    const items = await this.prisma.mealItem.findMany({
      where: { meal_log_id: mealLogId, deleted_at: null },
    });
    const total = items.reduce(
      (acc, i) => ({
        kcal: acc.kcal + Number(i.snapshot_kcal),
        protein: acc.protein + Number(i.snapshot_protein),
        carbs: acc.carbs + Number(i.snapshot_carbs),
        fat: acc.fat + Number(i.snapshot_fat),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );

    await this.prisma.mealLog.update({
      where: { id: mealLogId },
      data: {
        total_kcal: total.kcal,
        total_protein: total.protein,
        total_carbs: total.carbs,
        total_fat: total.fat,
      },
    });
  }
}
