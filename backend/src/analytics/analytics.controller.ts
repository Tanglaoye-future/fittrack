import {
  Controller, Get, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('daily-summary')
  @ApiOperation({ summary: '获取每日摘要' })
  getDailySummary(@Request() req, @Query('date') date: string) {
    return this.analyticsService.getDailySummary(req.user.userId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('weekly-summary')
  @ApiOperation({ summary: '获取周汇总' })
  getWeeklySummary(
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getWeeklySummary(req.user.userId, startDate, endDate);
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: '获取月汇总' })
  getMonthlySummary(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.analyticsService.getMonthlySummary(req.user.userId, parseInt(year), parseInt(month));
  }

  @Get('calories-trend')
  @ApiOperation({ summary: '热量趋势' })
  getCaloriesTrend(
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getCaloriesTrend(req.user.userId, startDate, endDate);
  }

  @Get('nutrition-analysis')
  @ApiOperation({ summary: '营养分析' })
  getNutritionAnalysis(
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getNutritionAnalysis(req.user.userId, startDate, endDate);
  }

  @Get('expense-analysis')
  @ApiOperation({ summary: '消费分析' })
  getExpenseAnalysis(
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getExpenseAnalysis(req.user.userId, startDate, endDate);
  }
}
