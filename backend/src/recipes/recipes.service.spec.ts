import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
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

const INGREDIENT = {
  id: 'ri-1',
  recipe_id: 'recipe-1',
  food_id: 'food-1',
  grams: '200',
  order_index: 0,
  food: FOOD,
};

const RECIPE = {
  id: 'recipe-1',
  user_id: 'user-1',
  name: '鸡胸饭',
  description: null,
  serving_count: 1,
  total_kcal: '330',
  total_protein: '62',
  total_carbs: '0',
  total_fat: '7.2',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ingredients: [INGREDIENT],
};

const buildPrismaMock = () => ({
  recipe: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  recipeIngredient: {
    deleteMany: jest.fn(),
  },
  food: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn({
    recipeIngredient: { deleteMany: jest.fn() },
    recipe: { update: jest.fn().mockResolvedValue(RECIPE) },
  })),
});

describe('RecipesService', () => {
  let service: RecipesService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        MacroCalculatorService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    jest.clearAllMocks();
  });

  // ── MacroCalculatorService (unit) ──────────────────────────────────────────

  describe('MacroCalculatorService (pure)', () => {
    let macros: MacroCalculatorService;

    beforeEach(() => {
      macros = new MacroCalculatorService();
    });

    it('200g chicken breast → 330 kcal', () => {
      const result = macros.calcFromGrams(FOOD, 200);
      expect(result.kcal).toBeCloseTo(330, 0);
      expect(result.protein).toBeCloseTo(62, 0);
    });

    it('sumMacros adds correctly', () => {
      const items = [
        { kcal: 100, protein: 10, carbs: 10, fat: 5 },
        { kcal: 200, protein: 20, carbs: 20, fat: 10 },
      ];
      const sum = macros.sumMacros(items);
      expect(sum.kcal).toBe(300);
      expect(sum.protein).toBe(30);
    });

    it('returns zeros for sumMacros with empty array', () => {
      const sum = macros.sumMacros([]);
      expect(sum.kcal).toBe(0);
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns user recipes', async () => {
      prismaMock.recipe.findMany.mockResolvedValue([RECIPE]);
      const result = await service.findAll('user-1');
      expect(result).toHaveLength(1);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns recipe when found', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(RECIPE);
      const result = await service.findOne('recipe-1', 'user-1');
      expect(result.id).toBe('recipe-1');
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates recipe with auto-calculated macros', async () => {
      prismaMock.food.findMany.mockResolvedValue([FOOD]);
      prismaMock.recipe.create.mockResolvedValue(RECIPE);

      const dto = {
        name: '鸡胸饭',
        ingredients: [{ food_id: 'food-1', grams: 200, order_index: 0 }],
      };

      const result = await service.create(dto, 'user-1');
      expect(prismaMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            total_kcal: expect.any(Number),
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('creates recipe with zero macros when no ingredients', async () => {
      prismaMock.recipe.create.mockResolvedValue({ ...RECIPE, total_kcal: '0', ingredients: [] });

      const result = await service.create({ name: '空配方' }, 'user-1');
      expect(prismaMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total_kcal: 0 }),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft deletes recipe', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(RECIPE);
      prismaMock.recipe.update.mockResolvedValue({ ...RECIPE, deleted_at: new Date() });

      const result = await service.remove('recipe-1', 'user-1');
      expect(result.deleted).toBe(true);
    });

    it('throws ForbiddenException when not owner', async () => {
      const otherUserRecipe = { ...RECIPE, user_id: 'other-user' };
      prismaMock.recipe.findFirst.mockResolvedValue(otherUserRecipe);
      await expect(service.remove('recipe-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when recipe not found', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(null);
      await expect(service.remove('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── clone ──────────────────────────────────────────────────────────────────

  describe('clone', () => {
    it('clones recipe with default name', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(RECIPE);
      prismaMock.food.findMany.mockResolvedValue([FOOD]);
      prismaMock.recipe.create.mockResolvedValue({ ...RECIPE, id: 'recipe-2', name: '鸡胸饭（副本）' });

      const result = await service.clone('recipe-1', {}, 'user-1');
      expect(prismaMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: '鸡胸饭（副本）' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('clones recipe with custom name', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(RECIPE);
      prismaMock.food.findMany.mockResolvedValue([FOOD]);
      prismaMock.recipe.create.mockResolvedValue({ ...RECIPE, id: 'recipe-3', name: '新名称' });

      await service.clone('recipe-1', { name: '新名称' }, 'user-1');
      expect(prismaMock.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: '新名称' }),
        }),
      );
    });
  });

  // ── getMacros ──────────────────────────────────────────────────────────────

  describe('getMacros', () => {
    it('returns total macros for single-serving recipe', async () => {
      prismaMock.recipe.findFirst.mockResolvedValue(RECIPE);
      const result = await service.getMacros('recipe-1', 'user-1');
      expect(result.total_kcal).toBeDefined();
      expect(result.per_serving).toBeNull();
    });

    it('returns per_serving macros for multi-serving recipe', async () => {
      const multiServing = { ...RECIPE, serving_count: 4 };
      prismaMock.recipe.findFirst.mockResolvedValue(multiServing);
      const result = await service.getMacros('recipe-1', 'user-1');
      expect(result.per_serving).not.toBeNull();
      expect(result.per_serving!.kcal).toBeCloseTo(Number(RECIPE.total_kcal) / 4, 2);
    });
  });
});
