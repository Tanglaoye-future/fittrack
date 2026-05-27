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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { WorkoutsService } from './workouts.service';
import {
  StartSessionDto,
  FinishSessionDto,
  UpdateSessionDto,
  ListSessionsDto,
  AddSessionExerciseDto,
  UpdateSessionExerciseDto,
  CreateSetEntryDto,
  UpdateSetEntryDto,
  BatchSetsDto,
} from './dto/workouts.dto';

@ApiTags('Workouts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // ── Sessions ───────────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: '训练记录列表' })
  listSessions(@Query() dto: ListSessionsDto, @CurrentUser() user: RequestUser) {
    return this.workoutsService.listSessions(user.userId, dto);
  }

  @Get('sessions/today')
  @ApiOperation({ summary: '今日训练（数组，一日可多次）' })
  getToday(@CurrentUser() user: RequestUser) {
    return this.workoutsService.getToday(user.userId);
  }

  @Post('sessions/start')
  @ApiOperation({ summary: '开始训练（返回 suggested_sets）' })
  startSession(@Body() dto: StartSessionDto, @CurrentUser() user: RequestUser) {
    return this.workoutsService.startSession(user.userId, dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '训练详情（含 exercises + sets）' })
  @ApiParam({ name: 'id' })
  getSession(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.workoutsService.getSession(id, user.userId);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: '更新训练（RPE / notes）' })
  @ApiParam({ name: 'id' })
  updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.updateSession(id, user.userId, dto);
  }

  @Post('sessions/:id/finish')
  @ApiOperation({ summary: '结束训练（写 end_time + 汇总）' })
  @ApiParam({ name: 'id' })
  finishSession(
    @Param('id') id: string,
    @Body() dto: FinishSessionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.finishSession(id, user.userId, dto);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '软删除训练' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  deleteSession(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.workoutsService.deleteSession(id, user.userId);
  }

  @Get('sessions/:id/summary')
  @ApiOperation({ summary: '训练汇总（总组数 / 总吨位 / 平均 RPE）' })
  @ApiParam({ name: 'id' })
  getSessionSummary(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.workoutsService.getSessionSummary(id, user.userId);
  }

  // ── SessionExercises ───────────────────────────────────────────────────────

  @Post('sessions/:sid/exercises')
  @ApiOperation({ summary: '向训练添加动作' })
  @ApiParam({ name: 'sid', description: 'Session UUID' })
  addSessionExercise(
    @Param('sid') sid: string,
    @Body() dto: AddSessionExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.addSessionExercise(sid, user.userId, dto);
  }

  @Patch('sessions/:sid/exercises/:eid')
  @ApiOperation({ summary: '更新动作顺序 / 备注' })
  updateSessionExercise(
    @Param('sid') sid: string,
    @Param('eid') eid: string,
    @Body() dto: UpdateSessionExerciseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.updateSessionExercise(sid, eid, user.userId, dto);
  }

  @Delete('sessions/:sid/exercises/:eid')
  @ApiOperation({ summary: '移除动作' })
  @HttpCode(HttpStatus.OK)
  removeSessionExercise(
    @Param('sid') sid: string,
    @Param('eid') eid: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.removeSessionExercise(sid, eid, user.userId);
  }

  // ── Sets (高频打卡) ────────────────────────────────────────────────────────

  @Post('sessions/:sid/exercises/:eid/sets')
  @ApiOperation({ summary: '完成一组（含 PR 检测，响应含 prs_broken）' })
  createSet(
    @Param('sid') sid: string,
    @Param('eid') eid: string,
    @Body() dto: CreateSetEntryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.createSet(sid, eid, user.userId, dto);
  }

  @Patch('sets/:setId')
  @ApiOperation({ summary: '修改组数据' })
  @ApiParam({ name: 'setId', description: 'SetEntry UUID' })
  updateSet(
    @Param('setId') setId: string,
    @Body() dto: UpdateSetEntryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.updateSet(setId, user.userId, dto);
  }

  @Delete('sets/:setId')
  @ApiOperation({ summary: '删组（软删除）' })
  @ApiParam({ name: 'setId', description: 'SetEntry UUID' })
  @HttpCode(HttpStatus.OK)
  deleteSet(@Param('setId') setId: string, @CurrentUser() user: RequestUser) {
    return this.workoutsService.deleteSet(setId, user.userId);
  }

  @Post('sets/batch')
  @ApiOperation({ summary: '离线批量上传（队列回放）' })
  batchSets(@Body() dto: BatchSetsDto, @CurrentUser() user: RequestUser) {
    return this.workoutsService.batchSets(user.userId, dto);
  }

  // ── PR & History ───────────────────────────────────────────────────────────

  @Get('exercises/:exerciseId/history')
  @ApiOperation({ summary: '某动作过去 N 次训练的 sets' })
  @ApiParam({ name: 'exerciseId' })
  getExerciseHistory(
    @Param('exerciseId') exerciseId: string,
    @Query('limit') limit: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.getExerciseHistory(user.userId, exerciseId, limit || 10);
  }

  @Get('exercises/:exerciseId/prs')
  @ApiOperation({ summary: '某动作的所有 PR' })
  @ApiParam({ name: 'exerciseId' })
  getExercisePrs(
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.workoutsService.getExercisePrs(user.userId, exerciseId);
  }

  @Get('prs/recent')
  @ApiOperation({ summary: '近 30 天打破的 PR' })
  getRecentPrs(@CurrentUser() user: RequestUser) {
    return this.workoutsService.getRecentPrs(user.userId);
  }
}
