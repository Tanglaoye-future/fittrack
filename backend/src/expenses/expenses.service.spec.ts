import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseCategoryEnum } from './dto/expenses.dto';
import { PrismaService } from '@/database/prisma.service';

const EXPENSE = {
  id: 'exp-1',
  user_id: 'user-1',
  category: 'SUPPLEMENT',
  amount: 200,
  currency: 'CNY',
  description: '蛋白粉',
  expense_date: new Date('2026-01-15'),
  deleted_at: null,
  client_op_id: 'op-exp-1',
};

const buildPrismaMock = () => ({
  expense: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  recurringExpense: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  budgetMonth: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
});

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  beforeEach(async () => {
    prismaMock = buildPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<ExpensesService>(ExpensesService);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns paginated expenses for user', async () => {
      prismaMock.expense.findMany.mockResolvedValue([EXPENSE]);
      prismaMock.expense.count.mockResolvedValue(1);
      const result = await service.list('user-1', {});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result.data).toHaveLength(1);
    });

    it('filters by category', async () => {
      prismaMock.expense.findMany.mockResolvedValue([EXPENSE]);
      prismaMock.expense.count.mockResolvedValue(1);
      await service.list('user-1', { category: ExpenseCategoryEnum.SUPPLEMENT });
      expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'SUPPLEMENT' }) }),
      );
    });
  });

  describe('create', () => {
    const dto = {
      category: 'SUPPLEMENT',
      amount: 200,
      expense_date: '2026-01-15',
      client_op_id: 'op-exp-1',
      client_ts: '2026-01-15T00:00:00Z',
    };

    it('returns existing if idempotent', async () => {
      prismaMock.expense.findUnique.mockResolvedValue(EXPENSE);
      const result = await service.create('user-1', dto as never);
      expect(prismaMock.expense.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('id', EXPENSE.id);
    });

    it('creates new expense', async () => {
      prismaMock.expense.findUnique.mockResolvedValue(null);
      prismaMock.expense.create.mockResolvedValue(EXPENSE);
      const result = await service.create('user-1', dto as never);
      expect(result).toHaveProperty('id', EXPENSE.id);
    });
  });

  describe('findOne', () => {
    it('returns expense if found', async () => {
      prismaMock.expense.findFirst.mockResolvedValue(EXPENSE);
      const result = await service.findOne('exp-1', 'user-1');
      expect(result).toHaveProperty('id', EXPENSE.id);
    });

    it('throws NotFoundException if not found', async () => {
      prismaMock.expense.findFirst.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes expense', async () => {
      prismaMock.expense.findFirst.mockResolvedValue(EXPENSE);
      prismaMock.expense.update.mockResolvedValue({ ...EXPENSE, deleted_at: new Date() });
      const result = await service.remove('exp-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('getMonthlySummary', () => {
    it('aggregates by category', async () => {
      prismaMock.expense.findMany.mockResolvedValue([
        { ...EXPENSE, category: 'SUPPLEMENT', amount: '200' },
        { ...EXPENSE, id: 'exp-2', category: 'SUPPLEMENT', amount: '100' },
        { ...EXPENSE, id: 'exp-3', category: 'EQUIPMENT', amount: '500' },
      ]);
      const result = await service.getMonthlySummary('user-1', 2026, 1);
      expect(result.year).toBe(2026);
      expect(result.month).toBe(1);
      expect(result.total).toBe(800);
      expect(result.by_category['SUPPLEMENT']).toBe(300);
      expect(result.by_category['EQUIPMENT']).toBe(500);
    });
  });

  describe('setBudget', () => {
    it('upserts budget', async () => {
      const budget = { user_id: 'user-1', year: 2026, month: 1, total_budget: 3000, lines: [] };
      prismaMock.budgetMonth.upsert.mockResolvedValue(budget);
      const result = await service.setBudget('user-1', {
        year: 2026,
        month: 1,
        total_budget: 3000,
        client_op_id: 'op-budget-1',
        client_ts: new Date().toISOString(),
      } as never);
      expect(result).toBe(budget);
    });
  });
});
