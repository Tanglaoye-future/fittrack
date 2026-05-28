import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ListExpensesDto,
  CreateRecurringExpenseDto,
  SetBudgetDto,
} from './dto/expenses.dto';

// Map frontend v1 category names → backend enum
const CATEGORY_MAP_TO_BACKEND: Record<string, string> = {
  FOOD: 'FOOD_GROCERY',
  GYM: 'GYM_MEMBERSHIP',
  SUPPLEMENTS: 'SUPPLEMENT',
  EQUIPMENT: 'EQUIPMENT',
  APPAREL: 'APPAREL_POSING',
  OTHER: 'OTHER',
};

// Map backend enum → frontend v1 category names
const CATEGORY_MAP_TO_FRONTEND: Record<string, string> = {
  FOOD_GROCERY: 'FOOD',
  DINING_OUT: 'FOOD',
  SUPPLEMENT: 'SUPPLEMENTS',
  COACH_FEE: 'OTHER',
  GYM_MEMBERSHIP: 'GYM',
  EQUIPMENT: 'EQUIPMENT',
  APPAREL_POSING: 'APPAREL',
  COMPETITION_FEE: 'OTHER',
  TRAVEL_COMPETITION: 'OTHER',
  RECOVERY: 'OTHER',
  OTHER: 'OTHER',
};

function mapExpenseToV1(expense: Record<string, unknown>) {
  return {
    ...expense,
    category: CATEGORY_MAP_TO_FRONTEND[(expense.category as string) ?? ''] ?? expense.category,
  };
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    dto: ListExpensesDto & { page?: number; limit?: number; start_date?: string; end_date?: string },
  ) {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (dto.category) {
      const backendCat = CATEGORY_MAP_TO_BACKEND[dto.category as string] ?? dto.category;
      where.category = backendCat;
    }

    const dateFrom = dto.date_from ?? dto.start_date;
    const dateTo = dto.date_to ?? dto.end_date;
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.gte = new Date(dateFrom);
      if (dateTo) range.lte = new Date(dateTo);
      where.expense_date = range;
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expense_date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data: items.map(mapExpenseToV1), total, page, limit };
  }

  async create(userId: string, dto: Partial<CreateExpenseDto> & Record<string, unknown>) {
    const clientOpId = (dto.client_op_id as string) || randomUUID();
    const clientTs = (dto.client_ts as string) || new Date().toISOString();

    const existing = await this.prisma.expense.findUnique({
      where: { client_op_id: clientOpId },
    });
    if (existing) return mapExpenseToV1(existing as unknown as Record<string, unknown>);

    const rawCategory = dto.category as string;
    const backendCategory = CATEGORY_MAP_TO_BACKEND[rawCategory] ?? rawCategory ?? 'OTHER';

    const expense = await this.prisma.expense.create({
      data: {
        user_id: userId,
        category: backendCategory as never,
        amount: dto.amount as number,
        currency: (dto.currency as string) ?? 'CNY',
        description: dto.description as string | undefined,
        expense_date: new Date((dto.expense_date as string) ?? new Date().toISOString().split('T')[0]),
        receipt_photo_url: dto.receipt_photo_url as string | undefined,
        client_op_id: clientOpId,
        client_ts: new Date(clientTs),
      },
    });

    return mapExpenseToV1(expense as unknown as Record<string, unknown>);
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });
    if (!expense) throw new NotFoundException('支出记录不存在');
    return mapExpenseToV1(expense as unknown as Record<string, unknown>);
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    await this.findOne(id, userId);
    const { client_op_id: _, client_ts: __, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (rest.category) data.category = (CATEGORY_MAP_TO_BACKEND[rest.category as string] ?? rest.category) as never;
    if (rest.expense_date) data.expense_date = new Date(rest.expense_date as string);
    return mapExpenseToV1(
      (await this.prisma.expense.update({ where: { id }, data })) as unknown as Record<string, unknown>,
    );
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.expense.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async getStats(
    userId: string,
    query: { start_date?: string; end_date?: string },
  ) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (query.start_date || query.end_date) {
      const range: Record<string, Date> = {};
      if (query.start_date) range.gte = new Date(query.start_date);
      if (query.end_date) range.lte = new Date(query.end_date);
      where.expense_date = range;
    }

    const expenses = await this.prisma.expense.findMany({ where });

    const total_amount = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const total_count = expenses.length;

    const catMap: Record<string, { amount: number; count: number }> = {};
    for (const e of expenses) {
      const cat = CATEGORY_MAP_TO_FRONTEND[(e.category as string) ?? ''] ?? (e.category as string);
      catMap[cat] = catMap[cat] ?? { amount: 0, count: 0 };
      catMap[cat].amount += Number(e.amount);
      catMap[cat].count += 1;
    }

    const categories = Object.entries(catMap).map(([category, v]) => ({ category, ...v }));

    return { total_amount, total_count, categories };
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);

    const expenses = await this.prisma.expense.findMany({
      where: { user_id: userId, deleted_at: null, expense_date: { gte: from, lte: to } },
    });

    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      const cat = e.category as string;
      acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    return {
      year,
      month,
      total: expenses.reduce((s, e) => s + Number(e.amount), 0),
      by_category: byCategory,
    };
  }

  // ── Recurring ──────────────────────────────────────────────────────────────

  async createRecurring(userId: string, dto: CreateRecurringExpenseDto) {
    const existing = await this.prisma.recurringExpense.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.recurringExpense.create({
      data: {
        user_id: userId,
        name: dto.name,
        category: dto.category as never,
        amount: dto.amount,
        cycle: dto.cycle as never,
        next_run_date: new Date(dto.next_run_date),
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  // ── Budget ─────────────────────────────────────────────────────────────────

  async setBudget(userId: string, dto: SetBudgetDto) {
    return this.prisma.budgetMonth.upsert({
      where: { user_id_year_month: { user_id: userId, year: dto.year, month: dto.month } },
      create: {
        user_id: userId,
        year: dto.year,
        month: dto.month,
        total_budget: dto.total_budget,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
      update: { total_budget: dto.total_budget },
      include: { lines: true },
    });
  }

  async getBudget(userId: string, year: number, month: number) {
    return this.prisma.budgetMonth.findUnique({
      where: { user_id_year_month: { user_id: userId, year, month } },
      include: { lines: true },
    });
  }
}
