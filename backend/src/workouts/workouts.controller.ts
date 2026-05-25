import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto, UpdateWorkoutDto, QueryWorkoutDto } from './dto/workouts.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Workouts')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class WorkoutsController {
  constructor(private workoutsService: WorkoutsService) {}

  @Post()
  @ApiOperation({ summary: '新增训练记录' })
  create(@Request() req, @Body() dto: CreateWorkoutDto) {
    return this.workoutsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取训练记录列表', description: '支持按日期、训练类型筛选和分页' })
  findAll(@Request() req, @Query() query: QueryWorkoutDto) {
    return this.workoutsService.findAll(req.user.userId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新训练记录' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateWorkoutDto) {
    return this.workoutsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除训练记录（软删除）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.workoutsService.remove(req.user.userId, id);
  }
}
