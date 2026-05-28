import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('strength/:exerciseId')
  @ApiOperation({ summary: '力量趋势（某动作历史 1RM / volume）' })
  @ApiParam({ name: 'exerciseId' })
  getStrengthTrends(
    @Param('exerciseId') exerciseId: string,
    @Query() query: { period?: string; date_from?: string; date_to?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analyticsService.getStrengthTrends(user.userId, exerciseId, query);
  }

  @Get('body-weight')
  @ApiOperation({ summary: '体重 + 体脂趋势' })
  getBodyWeightTrends(
    @Query() query: { period?: string; date_from?: string; date_to?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analyticsService.getBodyWeightTrends(user.userId, query);
  }

  @Get('macros')
  @ApiOperation({ summary: '每日 Macro 达成趋势' })
  getMacroTrends(
    @Query() query: { period?: string; date_from?: string; date_to?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analyticsService.getMacroTrends(user.userId, query);
  }

  @Get('daily-summary')
  @ApiOperation({ summary: '日汇总（含北极星指标）' })
  getDailySummaries(
    @Query() query: { period?: string; date_from?: string; date_to?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.analyticsService.getDailySummaries(user.userId, query);
  }

  @Get('prep-progress/:cycleId')
  @ApiOperation({ summary: '备赛进度（体重 / 体脂 / 周次）' })
  @ApiParam({ name: 'cycleId' })
  getPrepProgress(@Param('cycleId') cycleId: string, @CurrentUser() user: RequestUser) {
    return this.analyticsService.getPrepProgress(user.userId, cycleId);
  }
}
