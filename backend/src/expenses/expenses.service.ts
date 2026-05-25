import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateExpenseDto, QueryExpenseDto } from './dto/expenses.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        user_id: userId,
        category: dto.category as any,
        amount: dto.amount,
        currency: dto.currency || 'CNY',
        description: dto.description,
        expense_date: new Date(dto.expense_date),
      },
    });

    this.logger.log(`用户 ${userId} 创建了消费记录: ${expense.id}`);
    return expense;
  }

  async findAll(userId: string, query: QueryExpenseDto) {
    const { category, start_date, end_date, page = 1, limit = 20 } = query;
    const where: any = { user_id: userId, deleted_at: null };

    if (category) {
      where.category = category;
    }

    if (start_date || end_date) {
      where.expense_date = {};
      if (start_date) where.expense_date.gte = new Date(start_date);
      if (end_date) where.expense_date.lte = new Date(end_date);
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { expense_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { total, page, limit, data };
  }

  async getStats(userId: string, startDate?: string, endDate?: string) {
    const where: any = { user_id: userId, deleted_at: null };

    if (startDate || endDate) {
      where.expense_date = {};
      if (startDate) where.expense_date.gte = new Date(startDate);
      if (endDate) where.expense_date.lte = new Date(endDate);
    }

    const [totalStats, categoryBreakdown] = await Promise.all([
      this.prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total_amount: totalStats._sum.amount || 0,
      total_count: totalStats._count,
      categories: categoryBreakdown.map((c) => ({
        category: c.category,
        amount: c._sum.amount,
        count: c._count,
      })),
    };
  }
}
