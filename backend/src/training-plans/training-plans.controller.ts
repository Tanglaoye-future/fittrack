import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { TrainingPlansService } from './training-plans.service';
import {
  CreateTrainingPlanDto,
  UpdateTrainingPlanDto,
  CreateTrainingTemplateDto,
  UpdateTrainingTemplateDto,
  CreateTemplateExerciseDto,
  CloneTrainingPlanDto,
} from './dto/training-plans.dto';

@ApiTags('TrainingPlans')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('training-plans')
export class TrainingPlansController {
  constructor(private readonly trainingPlansService: TrainingPlansService) {}

  // ── Plans ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '我的训练计划列表' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.trainingPlansService.findAll(user.userId);
  }

  @Get('active')
  @ApiOperation({ summary: '当前激活的计划' })
  findActive(@CurrentUser() user: RequestUser) {
    return this.trainingPlansService.findActive(user.userId);
  }

  @Get('official-templates')
  @ApiOperation({ summary: '官方预设计划库' })
  findOfficialTemplates() {
    return this.trainingPlansService.findOfficialTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: '计划详情（含模板 + 动作）' })
  @ApiParam({ name: 'id', description: '计划 UUID' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.trainingPlansService.findOne(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: '新建训练计划（可嵌套写入模板和动作）' })
  create(
    @Body() dto: CreateTrainingPlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.create(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新计划基础信息' })
  @ApiParam({ name: 'id', description: '计划 UUID' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingPlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除计划（软删除）' })
  @ApiParam({ name: 'id', description: '计划 UUID' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.trainingPlansService.remove(id, user.userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '激活计划（同时取消其他激活计划）' })
  @ApiParam({ name: 'id', description: '计划 UUID' })
  activate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.trainingPlansService.activate(id, user.userId);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: '克隆计划' })
  @ApiParam({ name: 'id', description: '计划 UUID' })
  clone(
    @Param('id') id: string,
    @Body() dto: CloneTrainingPlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.clone(id, dto, user.userId);
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  @Post(':planId/templates')
  @ApiOperation({ summary: '向计划添加训练模板' })
  addTemplate(
    @Param('planId') planId: string,
    @Body() dto: CreateTrainingTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.addTemplate(planId, dto, user.userId);
  }

  @Patch(':planId/templates/:templateId')
  @ApiOperation({ summary: '更新模板' })
  updateTemplate(
    @Param('planId') planId: string,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateTrainingTemplateDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.updateTemplate(planId, templateId, dto, user.userId);
  }

  @Delete(':planId/templates/:templateId')
  @ApiOperation({ summary: '删除模板' })
  @HttpCode(HttpStatus.OK)
  removeTemplate(
    @Param('planId') planId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.removeTemplate(planId, templateId, user.userId);
  }

  // ── Template Exercises ─────────────────────────────────────────────────────

  @Post(':planId/templates/:templateId/exercises')
  @ApiOperation({ summary: '向模板添加动作' })
  addTemplateExercise(
    @Param('planId') planId: string,
    @Param('templateId') templateId: string,
    @Body() dto: CreateTemplateExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.addTemplateExercise(planId, templateId, dto, user.userId);
  }

  @Delete(':planId/templates/:templateId/exercises/:entryId')
  @ApiOperation({ summary: '从模板移除动作' })
  @HttpCode(HttpStatus.OK)
  removeTemplateExercise(
    @Param('planId') planId: string,
    @Param('templateId') templateId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.trainingPlansService.removeTemplateExercise(
      planId,
      templateId,
      entryId,
      user.userId,
    );
  }
}
