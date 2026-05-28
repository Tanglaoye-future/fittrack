import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ListExpensesDto,
  CreateRecurringExpenseDto,
  SetBudgetDto,
} from './dto/expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, dto: ListExpensesDto) {
    const where: Record<string, unknown> = { user_id: userId, deleted_at: null };
    if (dto.category) where.category = dto.category;
    if (dto.date_from || dto.date_to) {
      const range: Record<string, Date> = {};
      if (dto.date_from) range.gte = new Date(dto.date_from);
      if (dto.date_to) range.lte = new Date(dto.date_to);
      where.expense_date = range;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { expense_date: 'desc' },
    });
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({
      where: { client_op_id: dto.client_op_id },
    });
    if (existing) return existing;

    return this.prisma.expense.create({
      data: {
        user_id: userId,
        category: dto.category as never,
        amount: dto.amount,
        currency: dto.currency ?? 'CNY',
        description: dto.description,
        expense_date: new Date(dto.expense_date),
        receipt_photo_url: dto.receipt_photo_url,
        client_op_id: dto.client_op_id,
        client_ts: new Date(dto.client_ts),
      },
    });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, user_id: userId, deleted_at: null },
    });
    if (!expense) throw new NotFoundException('支出记录不存在');
    return expense;
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    await this.findOne(id, userId);
    const { client_op_id: _, client_ts: __, ...rest } = dto;
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.category && { category: rest.category as never }),
        ...(rest.expense_date && { expense_date: new Date(rest.expense_date) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.expense.update({ where: { id }, data: { deleted_at: new Date() } });
    return { deleted: true };
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);

    const expenses = await this.prisma.expense.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        expense_date: { gte: from, lte: to },
      },
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
