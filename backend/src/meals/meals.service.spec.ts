import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MealsService } from './meals.service';
import { PrismaService } from '@/database/prisma.service';
import { MacroCalculatorService } from '@/common/services/macro-calculator.service';

const FOOD = {
  id: 'food-1',
  name_zh: '鸡胸肉',
  kcal_per_100g: '165',
  protein_per_100g: '31',
  carbs_per_100g: '0',
  fat_per_100g: '3.6',
};

const MEAL_LOG = {
  id: 'meal-1',
  user_id: 'user-1',
  meal_slot: 'LUNCH',
  consumed_at: new Date('2026-05-27T12:00:00Z'),
  meal_date: new Date('2026-05-27'),
  is_planned: false,
  notes: null,
  total_kcal: '330',
  total_protein: '62',
  total_carbs: '0',
  total_fat: '7.2',
  client_op_id: 'op-1',
  client_ts: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  items: [],
};

const MEAL_ITEM = {
  id: 'item-1',
  meal_log_id: 'meal-1',
  food_id: 'food-1',
  recipe_id: null,
  grams: '200',
  snapshot_kcal: '330',
  snapshot_protein: '62',
  snapshot_carbs: '0',
  snapshot_fat: '7.2',
  client_op_id: 'item-op-1',
  client_ts: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  meal_log: MEAL_LOG,
};

const TEMPLATE = {
  id: 'tmpl-1',
  user_id: 'user-1',
  name: '备赛餐单',
  prep_cycle_id: null,
  total_kcal: 2000,
  total_protein_g: 200,
  total_carbs_g: 150,
  total_fat_g: 55,
  is_active: false,
  client_op_id: 'tmpl-op-1',
  client_ts: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  scheduled_meals: [],
};

const buildPrismaMock = () => ({
  mealLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  mealItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mealPlanTemplate: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  scheduledMeal: {
    findFirst: jest.fn(),
  },
  macroTarget: {
    findUnique: jest.fn(),
  },
  food: {
    findUnique: jest.fn(),
  },
  recipe: {
    findUnique: jest.fn(),
  },
});

describe('MealsService', () => {
  let service: MealsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        MacroCalculatorService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
    jest.clearAllMocks();
  });

  // ── listMeals ──────────────────────────────────────────────────────────────

  describe('listMeals', () => {
    it('returns all user meals', async () => {
      prismaMock.mealLog.findMany.mockResolvedValue([MEAL_LOG]);
      const result = await service.listMeals('user-1', {});
      expect(result).toHaveLength(1);
    });

    it('filters by date when provided', async () => {
      prismaMock.mealLog.findMany.mockResolvedValue([MEAL_LOG]);
      await service.listMeals('user-1', { date: '2026-05-27' });
      const [call] = prismaMock.mealLog.findMany.mock.calls;
      expect(call[0].where.meal_date).toBeDefined();
    });
  });

  // ── getToday ───────────────────────────────────────────────────────────────

  describe('getToday', () => {
    it('returns meals + macro_target + achieved totals', async () => {
      prismaMock.mealLog.findMany.mockResolvedValue([MEAL_LOG]);
      prismaMock.macroTarget.findUnique.mockResolvedValue({ kcal: 2500, protein_g: 220 });

      const result = await service.getToday('user-1');
      expect(result.meals).toHaveLength(1);
      expect(result.macro_target).toBeDefined();
      expect(result.achieved.kcal).toBeCloseTo(330, 0);
    });
  });

  // ── createMealLog ──────────────────────────────────────────────────────────

  describe('createMealLog', () => {
    it('creates meal log with items', async () => {
      prismaMock.mealLog.findUnique.mockResolvedValue(null);
      prismaMock.food.findUnique.mockResolvedValue(FOOD);
      prismaMock.mealLog.create.mockResolvedValue(MEAL_LOG);

      const dto = {
        meal_slot: 'LUNCH' as never,
        consumed_at: '2026-05-27T12:00:00Z',
        client_op_id: 'op-1',
        client_ts: '2026-05-27T12:00:00Z',
        items: [{ food_id: 'food-1', grams: 200, client_op_id: 'item-op-1', client_ts: '2026-05-27T12:00:00Z' }],
      };

      const result = await service.createMealLog('user-1', dto);
      expect(prismaMock.mealLog.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('returns existing log when client_op_id already used (idempotent)', async () => {
      prismaMock.mealLog.findUnique.mockResolvedValue(MEAL_LOG);

      const dto = {
        meal_slot: 'LUNCH' as never,
        consumed_at: '2026-05-27T12:00:00Z',
        client_op_id: 'op-1',
        client_ts: '2026-05-27T12:00:00Z',
      };

      const result = await service.createMealLog('user-1', dto);
      expect(prismaMock.mealLog.create).not.toHaveBeenCalled();
      expect(result.id).toBe('meal-1');
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('throws BadRequestException when neither food_id nor recipe_id provided', async () => {
      prismaMock.mealLog.findFirst.mockResolvedValue(MEAL_LOG);
      await expect(
        service.addItem('meal-1', 'user-1', {
          grams: 100,
          client_op_id: 'x',
          client_ts: new Date().toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when both food_id and recipe_id provided', async () => {
      prismaMock.mealLog.findFirst.mockResolvedValue(MEAL_LOG);
      await expect(
        service.addItem('meal-1', 'user-1', {
          food_id: 'f',
          recipe_id: 'r',
          grams: 100,
          client_op_id: 'x',
          client_ts: new Date().toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns existing item when client_op_id is duplicate (idempotent)', async () => {
      prismaMock.mealLog.findFirst.mockResolvedValue(MEAL_LOG);
      prismaMock.mealItem.findUnique.mockResolvedValue(MEAL_ITEM);

      const result = await service.addItem('meal-1', 'user-1', {
        food_id: 'food-1',
        grams: 200,
        client_op_id: 'item-op-1',
        client_ts: new Date().toISOString(),
      });
      expect(prismaMock.mealItem.create).not.toHaveBeenCalled();
      expect(result.id).toBe('item-1');
    });

    it('creates new item and recalculates totals', async () => {
      prismaMock.mealLog.findFirst.mockResolvedValue(MEAL_LOG);
      prismaMock.mealItem.findUnique.mockResolvedValue(null);
      prismaMock.food.findUnique.mockResolvedValue(FOOD);
      prismaMock.mealItem.create.mockResolvedValue(MEAL_ITEM);
      prismaMock.mealItem.findMany.mockResolvedValue([MEAL_ITEM]);
      prismaMock.mealLog.update.mockResolvedValue(MEAL_LOG);

      const result = await service.addItem('meal-1', 'user-1', {
        food_id: 'food-1',
        grams: 200,
        client_op_id: 'new-op',
        client_ts: new Date().toISOString(),
      });
      expect(prismaMock.mealItem.create).toHaveBeenCalled();
      expect(prismaMock.mealLog.update).toHaveBeenCalled();
    });
  });

  // ── deleteItem ─────────────────────────────────────────────────────────────

  describe('deleteItem', () => {
    it('soft deletes item and recalculates totals', async () => {
      prismaMock.mealItem.findFirst.mockResolvedValue(MEAL_ITEM);
      prismaMock.mealItem.update.mockResolvedValue({ ...MEAL_ITEM, deleted_at: new Date() });
      prismaMock.mealItem.findMany.mockResolvedValue([]);
      prismaMock.mealLog.update.mockResolvedValue(MEAL_LOG);

      const result = await service.deleteItem('item-1', 'user-1');
      expect(result.deleted).toBe(true);
      expect(prismaMock.mealLog.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when item not found', async () => {
      prismaMock.mealItem.findFirst.mockResolvedValue(null);
      await expect(service.deleteItem('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user does not own the meal', async () => {
      prismaMock.mealItem.findFirst.mockResolvedValue({
        ...MEAL_ITEM,
        meal_log: { ...MEAL_LOG, user_id: 'other-user' },
      });
      await expect(service.deleteItem('item-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── plan templates ─────────────────────────────────────────────────────────

  describe('listPlanTemplates', () => {
    it('returns user plan templates', async () => {
      prismaMock.mealPlanTemplate.findMany.mockResolvedValue([TEMPLATE]);
      const result = await service.listPlanTemplates('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createPlanTemplate', () => {
    it('creates meal plan template (idempotent)', async () => {
      prismaMock.mealPlanTemplate.findUnique.mockResolvedValue(null);
      prismaMock.mealPlanTemplate.create.mockResolvedValue(TEMPLATE);

      const dto = {
        name: '备赛餐单',
        total_kcal: 2000,
        total_protein_g: 200,
        total_carbs_g: 150,
        total_fat_g: 55,
        client_op_id: 'tmpl-op-1',
        client_ts: new Date().toISOString(),
      };

      const result = await service.createPlanTemplate('user-1', dto);
      expect(prismaMock.mealPlanTemplate.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('returns existing template when client_op_id used (idempotent)', async () => {
      prismaMock.mealPlanTemplate.findUnique.mockResolvedValue(TEMPLATE);

      const result = await service.createPlanTemplate('user-1', {
        name: 'X',
        total_kcal: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        client_op_id: 'tmpl-op-1',
        client_ts: new Date().toISOString(),
      });
      expect(prismaMock.mealPlanTemplate.create).not.toHaveBeenCalled();
      expect(result.id).toBe('tmpl-1');
    });
  });

  describe('activatePlanTemplate', () => {
    it('deactivates others and activates target', async () => {
      prismaMock.mealPlanTemplate.findFirst.mockResolvedValue(TEMPLATE);
      prismaMock.mealPlanTemplate.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.mealPlanTemplate.update.mockResolvedValue({ ...TEMPLATE, is_active: true });

      const result = await service.activatePlanTemplate('tmpl-1', 'user-1');
      expect(result.activated).toBe(true);
      expect(prismaMock.mealPlanTemplate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { is_active: false } }),
      );
    });

    it('throws NotFoundException when template not found', async () => {
      prismaMock.mealPlanTemplate.findFirst.mockResolvedValue(null);
      await expect(service.activatePlanTemplate('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
