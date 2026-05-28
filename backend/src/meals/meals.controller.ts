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
import { MealsService } from './meals.service';
import {
  AddMealItemDto,
  CreateMealLogDto,
  CreateMealPlanTemplateDto,
  ListMealsDto,
  QuickLogDto,
  UpdateMealItemDto,
  UpdateMealLogDto,
  UpdateMealPlanTemplateDto,
} from './dto/meals.dto';

@ApiTags('Meals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  // ── Meal logs ──────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '[V1] 餐次列表（分页，平铺格式）' })
  listMeals(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.mealsService.listMealsV1(user.userId, query);
  }

  @Get('today')
  @ApiOperation({ summary: '今日饮食 + 宏量目标 + 已达成' })
  getToday(@CurrentUser() user: RequestUser) {
    return this.mealsService.getToday(user.userId);
  }

  @Get('planned/today')
  @ApiOperation({ summary: '今日计划餐（来自激活模板）' })
  getPlannedToday(@CurrentUser() user: RequestUser) {
    return this.mealsService.getPlannedToday(user.userId);
  }

  @Get('plan-templates')
  @ApiOperation({ summary: '我的餐单模板列表' })
  listPlanTemplates(@CurrentUser() user: RequestUser) {
    return this.mealsService.listPlanTemplates(user.userId);
  }

  @Post('plan-templates')
  @ApiOperation({ summary: '新建餐单模板（嵌套 scheduled_meals）' })
  createPlanTemplate(@Body() dto: CreateMealPlanTemplateDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.createPlanTemplate(user.userId, dto);
  }

  @Patch('plan-templates/:id')
  @ApiOperation({ summary: '更新餐单模板' })
  @ApiParam({ name: 'id' })
  updatePlanTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mealsService.updatePlanTemplate(id, user.userId, dto);
  }

  @Post('plan-templates/:id/activate')
  @ApiOperation({ summary: '激活餐单模板（同时取消其他激活）' })
  @ApiParam({ name: 'id' })
  activatePlanTemplate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.mealsService.activatePlanTemplate(id, user.userId);
  }

  @Post('quick-log')
  @ApiOperation({ summary: 'Loop B 一键打卡（按计划餐 1-click 确认）' })
  quickLog(@Body() dto: QuickLogDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.quickLog(user.userId, dto);
  }

  @Post()
  @ApiOperation({ summary: '[V1] 新建餐次（平铺格式）' })
  createMealLog(@Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.mealsService.createMealV1(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '餐次详情' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.mealsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[V1] 更新餐次（平铺格式）' })
  @ApiParam({ name: 'id' })
  updateMealLog(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mealsService.updateMealV1(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[V1] 软删餐次' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  deleteMealLog(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.mealsService.deleteMealV1(id, user.userId);
  }

  @Post(':id/items')
  @ApiOperation({ summary: '向餐次添加食材项' })
  @ApiParam({ name: 'id' })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddMealItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mealsService.addItem(id, user.userId, dto);
  }

  // ── Meal items ─────────────────────────────────────────────────────────────

  @Patch('items/:itemId')
  @ApiOperation({ summary: '改食材项克数（自动重算 snapshot）' })
  @ApiParam({ name: 'itemId' })
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMealItemDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.mealsService.updateItem(itemId, user.userId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: '删除食材项' })
  @ApiParam({ name: 'itemId' })
  @HttpCode(HttpStatus.OK)
  deleteItem(@Param('itemId') itemId: string, @CurrentUser() user: RequestUser) {
    return this.mealsService.deleteItem(itemId, user.userId);
  }
}
