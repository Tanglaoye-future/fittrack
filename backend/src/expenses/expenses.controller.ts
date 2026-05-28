import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import {
  CreateRecurringExpenseDto,
  ListExpensesDto,
  SetBudgetDto,
  UpdateExpenseDto,
} from './dto/expenses.dto';

@ApiTags('Expenses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('stats')
  @ApiOperation({ summary: '消费统计（total_amount/total_count/categories）' })
  getStats(
    @Query() query: { start_date?: string; end_date?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.expensesService.getStats(user.userId, query);
  }

  @Get('summary/monthly')
  @ApiOperation({ summary: '月支出汇总（?year=&month=）' })
  getMonthlySummary(
    @Query('year') year: number,
    @Query('month') month: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.expensesService.getMonthlySummary(user.userId, year, month);
  }

  @Get()
  @ApiOperation({ summary: '支出列表（分页，?category=&start_date=&end_date=）' })
  list(@Query() dto: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.expensesService.list(user.userId, dto as never);
  }

  @Post()
  @ApiOperation({ summary: '新增支出（自动生成 client_op_id）' })
  create(@Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.expensesService.create(user.userId, dto);
  }

  @Get('budgets/:year/:month')
  @ApiOperation({ summary: '获取指定月预算' })
  getBudget(
    @Param('year') year: number,
    @Param('month') month: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.expensesService.getBudget(user.userId, year, month);
  }

  @Get(':id')
  @ApiOperation({ summary: '支出详情' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.expensesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新支出' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.expensesService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '软删支出' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.expensesService.remove(id, user.userId);
  }

  @Post('recurring')
  @ApiOperation({ summary: '新建循环账单' })
  createRecurring(@Body() dto: CreateRecurringExpenseDto, @CurrentUser() user: RequestUser) {
    return this.expensesService.createRecurring(user.userId, dto);
  }

  @Post('budgets')
  @ApiOperation({ summary: '设置月度预算' })
  setBudget(@Body() dto: SetBudgetDto, @CurrentUser() user: RequestUser) {
    return this.expensesService.setBudget(user.userId, dto);
  }
}
