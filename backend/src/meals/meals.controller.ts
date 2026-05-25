import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { CreateMealDto, UpdateMealDto, QueryMealDto } from './dto/meals.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Meals')
@Controller('meals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class MealsController {
  constructor(private mealsService: MealsService) {}

  @Post()
  @ApiOperation({ summary: '新增饮食记录' })
  create(@Request() req, @Body() dto: CreateMealDto) {
    return this.mealsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取饮食记录列表', description: '支持按日期、餐食类型筛选和分页' })
  findAll(@Request() req, @Query() query: QueryMealDto) {
    return this.mealsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条饮食记录' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.mealsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新饮食记录' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateMealDto) {
    return this.mealsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除饮食记录（软删除）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.mealsService.remove(req.user.userId, id);
  }
}
