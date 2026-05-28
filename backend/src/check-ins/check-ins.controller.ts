import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { CheckInsService, CreateCheckInDto, CoachReviewDto } from './check-ins.service';

@ApiTags('CheckIns')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Get()
  @ApiOperation({ summary: '我的 check-in 历史' })
  list(@CurrentUser() user: RequestUser) {
    return this.checkInsService.list(user.userId);
  }

  @Get('draft')
  @ApiOperation({ summary: '本周预填草稿（系统自动聚合过去 7 天）' })
  getDraft(@CurrentUser() user: RequestUser) {
    return this.checkInsService.getDraft(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '提交本周 check-in' })
  create(@Body() dto: CreateCheckInDto, @CurrentUser() user: RequestUser) {
    return this.checkInsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Check-in 详情 + 教练评注' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.checkInsService.findOne(id, user.userId);
  }

  @Patch(':id/coach-response')
  @ApiOperation({ summary: '教练回复 + 下发调整' })
  @ApiParam({ name: 'id' })
  coachReview(
    @Param('id') id: string,
    @Body() dto: CoachReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.checkInsService.coachReview(id, user.userId, dto);
  }
}
