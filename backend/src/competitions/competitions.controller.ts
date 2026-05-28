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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { CompetitionsService } from './competitions.service';
import {
  CreateCompetitionDto,
  CreatePhaseConfigDto,
  CreatePrepCycleDto,
  UpdateCompetitionDto,
  UpdatePhaseConfigDto,
} from './dto/competitions.dto';

@ApiTags('Competitions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @ApiOperation({ summary: '我的所有比赛目标' })
  list(@CurrentUser() user: RequestUser) {
    return this.competitionsService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '新增比赛目标（自动关联 PrepCycle）' })
  create(@Body() dto: CreateCompetitionDto, @CurrentUser() user: RequestUser) {
    return this.competitionsService.create(user.userId, dto);
  }

  @Get('active/countdown')
  @ApiOperation({ summary: '当前激活比赛倒数 + 阶段' })
  getActiveCountdown(@CurrentUser() user: RequestUser) {
    return this.competitionsService.getActiveCountdown(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '比赛详情 + 备赛周期' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.competitionsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新比赛' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompetitionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '软删比赛' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.competitionsService.remove(id, user.userId);
  }

  // ── Prep Cycles ────────────────────────────────────────────────────────────

  @Post(':id/prep-cycles')
  @ApiOperation({ summary: '新建备赛周期' })
  @ApiParam({ name: 'id' })
  createPrepCycle(
    @Param('id') id: string,
    @Body() dto: CreatePrepCycleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.createPrepCycle(id, user.userId, dto);
  }

  @Get(':id/prep-cycles/:pid')
  @ApiOperation({ summary: '备赛周期详情' })
  getPrepCycle(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.getPrepCycle(id, pid, user.userId);
  }

  @Post(':id/prep-cycles/:pid/phases')
  @ApiOperation({ summary: '添加阶段配置' })
  addPhase(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Body() dto: CreatePhaseConfigDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.addPhase(id, pid, user.userId, dto);
  }

  @Post(':id/prep-cycles/:pid/auto-generate-phases')
  @ApiOperation({ summary: '自动生成 macros 递减阶段' })
  autoGeneratePhases(
    @Param('pid') pid: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.autoGeneratePhases(pid, user.userId);
  }

  @Get(':id/prep-cycles/:pid/today-targets')
  @ApiOperation({ summary: '今日 macros / 有氧目标' })
  getTodayTargets(
    @Param('pid') pid: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.getTodayTargets(pid, user.userId);
  }
}

// Separate controller for /prep-cycles/:id paths
import { Controller as Ctrl } from '@nestjs/common';

@ApiTags('Competitions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Ctrl('prep-cycles')
export class PrepCyclesController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Patch('phases/:id')
  @ApiOperation({ summary: '更新阶段配置' })
  @ApiParam({ name: 'id' })
  updatePhase(
    @Param('id') id: string,
    @Body() dto: UpdatePhaseConfigDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.competitionsService.updatePhase(id, user.userId, dto);
  }
}
