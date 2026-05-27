import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';

// POST /expenses
// GET  /expenses
// GET  /expenses/:id
// PATCH /expenses/:id
// DELETE /expenses/:id
// GET  /expenses/summary/monthly
// POST /budgets
// GET  /budgets/:year/:month
// POST /budgets/recurring

@ApiTags('Expenses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}
}
