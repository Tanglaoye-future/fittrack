import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, QueryExpenseDto } from './dto/expenses.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: '新增消费记录' })
  create(@Request() req, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取消费记录列表', description: '支持按类别、日期范围筛选和分页' })
  findAll(@Request() req, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(req.user.userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: '消费统计', description: '按类别汇总消费统计' })
  getStats(@Request() req, @Query('start_date') startDate?: string, @Query('end_date') endDate?: string) {
    return this.expensesService.getStats(req.user.userId, startDate, endDate);
  }
}
