import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

// GET /analytics/strength
// GET /analytics/body-weight
// GET /analytics/macros
// GET /analytics/prep-progress
// GET /analytics/daily-summary

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
}
