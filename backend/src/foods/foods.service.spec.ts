import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { PrismaService } from '@/database/prisma.service';

const FOOD = {
  id: 'food-1',
  name_zh: '鸡胸肉',
  name_en: 'Chicken Breast',
  brand: null,
  barcode: null,
  kcal_per_100g: '165',
  protein_per_100g: '31',
  carbs_per_100g: '0',
  fat_per_100g: '3.6',
  fiber_per_100g: null,
  sugar_per_100g: null,
  sodium_mg_per_100g: null,
  potassium_mg_per_100g: null,
  default_serving_g: null,
  serving_name: null,
  category: 'MEAT_PROTEIN',
  is_official: true,
  created_by: null,
  verified: true,
  created_at: new Date(),
};

const USER_FOOD = { ...FOOD, id: 'food-2', is_official: false, created_by: 'user-1', barcode: '123456' };

const buildPrismaMock = () => ({
  food: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mealItem: {
    findMany: jest.fn(),
  },
  foodFavorite: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('FoodsService', () => {
  let service: FoodsService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
    jest.clearAllMocks();
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated results', async () => {
      prismaMock.food.findMany.mockResolvedValue([FOOD]);
      prismaMock.food.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.has_next).toBe(false);
    });

    it('applies category filter', async () => {
      prismaMock.food.findMany.mockResolvedValue([]);
      prismaMock.food.count.mockResolvedValue(0);

      await service.findAll({ category: 'MEAT_PROTEIN' as never });

      const [call] = prismaMock.food.findMany.mock.calls;
      expect(call[0].where.category).toBe('MEAT_PROTEIN');
    });

    it('applies keyword search OR clause', async () => {
      prismaMock.food.findMany.mockResolvedValue([]);
      prismaMock.food.count.mockResolvedValue(0);

      await service.findAll({ q: '鸡胸' });

      const [call] = prismaMock.food.findMany.mock.calls;
      expect(call[0].where.OR).toBeDefined();
      expect(call[0].where.OR).toHaveLength(3);
    });

    it('applies barcode filter', async () => {
      prismaMock.food.findMany.mockResolvedValue([USER_FOOD]);
      prismaMock.food.count.mockResolvedValue(1);

      await service.findAll({ barcode: '123456' });

      const [call] = prismaMock.food.findMany.mock.calls;
      expect(call[0].where.barcode).toBe('123456');
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns food by id', async () => {
      prismaMock.food.findUnique.mockResolvedValue(FOOD);
      const result = await service.findOne('food-1');
      expect(result.id).toBe('food-1');
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.food.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByBarcode ──────────────────────────────────────────────────────────

  describe('findByBarcode', () => {
    it('returns food by barcode', async () => {
      prismaMock.food.findUnique.mockResolvedValue(USER_FOOD);
      const result = await service.findByBarcode('123456');
      expect(result.barcode).toBe('123456');
    });

    it('throws NotFoundException when barcode not found', async () => {
      prismaMock.food.findUnique.mockResolvedValue(null);
      await expect(service.findByBarcode('000')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findRecent ─────────────────────────────────────────────────────────────

  describe('findRecent', () => {
    it('returns empty array when no meal items', async () => {
      prismaMock.mealItem.findMany.mockResolvedValue([]);
      const result = await service.findRecent('user-1');
      expect(result).toEqual([]);
      expect(prismaMock.food.findMany).not.toHaveBeenCalled();
    });

    it('returns foods matching recent meal item food_ids', async () => {
      prismaMock.mealItem.findMany.mockResolvedValue([{ food_id: 'food-1' }]);
      prismaMock.food.findMany.mockResolvedValue([FOOD]);

      const result = await service.findRecent('user-1');
      expect(result).toHaveLength(1);
    });
  });

  // ── favorites ──────────────────────────────────────────────────────────────

  describe('findFavorites', () => {
    it('returns favorited foods', async () => {
      prismaMock.foodFavorite.findMany.mockResolvedValue([{ food: FOOD, user_id: 'user-1', food_id: 'food-1', created_at: new Date() }]);
      const result = await service.findFavorites('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('food-1');
    });
  });

  describe('addFavorite', () => {
    it('upserts favorite', async () => {
      prismaMock.food.findUnique.mockResolvedValue(FOOD);
      prismaMock.foodFavorite.upsert.mockResolvedValue({});

      const result = await service.addFavorite('food-1', 'user-1');
      expect(result.favorited).toBe(true);
      expect(prismaMock.foodFavorite.upsert).toHaveBeenCalled();
    });

    it('throws NotFoundException if food not found', async () => {
      prismaMock.food.findUnique.mockResolvedValue(null);
      await expect(service.addFavorite('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFavorite', () => {
    it('removes favorite', async () => {
      prismaMock.foodFavorite.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.removeFavorite('food-1', 'user-1');
      expect(result.favorited).toBe(false);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name_zh: '自建食材',
      kcal_per_100g: 200,
      protein_per_100g: 20,
      carbs_per_100g: 10,
      fat_per_100g: 5,
      category: 'OTHER' as never,
    };

    it('creates user food without barcode', async () => {
      prismaMock.food.create.mockResolvedValue({ ...FOOD, ...dto, is_official: false });

      const result = await service.create(dto, 'user-1');
      expect(prismaMock.food.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_official: false, created_by: 'user-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws ConflictException when barcode already exists', async () => {
      prismaMock.food.findUnique.mockResolvedValue(USER_FOOD);
      await expect(service.create({ ...dto, barcode: '123456' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── scanBarcode ────────────────────────────────────────────────────────────

  describe('scanBarcode', () => {
    it('returns found:true when food exists', async () => {
      prismaMock.food.findUnique.mockResolvedValue(USER_FOOD);
      const result = await service.scanBarcode('123456');
      expect(result.found).toBe(true);
      expect(result.food).not.toBeNull();
    });

    it('returns found:false when food not found', async () => {
      prismaMock.food.findUnique.mockResolvedValue(null);
      const result = await service.scanBarcode('000');
      expect(result.found).toBe(false);
      expect(result.food).toBeNull();
    });
  });
});
