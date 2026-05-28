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
import { SupplementsService } from './supplements.service';
import {
  CreateSupplementLogDto,
  CreateSupplementScheduleDto,
  ListSupplementLogsDto,
  UpdateSupplementScheduleDto,
} from './dto/supplements.dto';

@ApiTags('Supplements')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('supplements')
export class SupplementsController {
  constructor(private readonly supplementsService: SupplementsService) {}

  @Get('schedules')
  @ApiOperation({ summary: '我的补剂套餐列表' })
  listSchedules(@CurrentUser() user: RequestUser) {
    return this.supplementsService.listSchedules(user.userId);
  }

  @Post('schedules')
  @ApiOperation({ summary: '新建补剂套餐（含 items）' })
  createSchedule(@Body() dto: CreateSupplementScheduleDto, @CurrentUser() user: RequestUser) {
    return this.supplementsService.createSchedule(user.userId, dto);
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: '更新补剂套餐' })
  @ApiParam({ name: 'id' })
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateSupplementScheduleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.supplementsService.updateSchedule(id, user.userId, dto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: '软删补剂套餐' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  deleteSchedule(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.supplementsService.deleteSchedule(id, user.userId);
  }

  @Post('schedules/:id/log-all')
  @ApiOperation({ summary: '一键套餐打卡' })
  @ApiParam({ name: 'id' })
  logAll(
    @Param('id') id: string,
    @Body() body: { taken_at: string; client_op_id: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.supplementsService.logAll(id, user.userId, body.taken_at, body.client_op_id);
  }

  @Post('logs')
  @ApiOperation({ summary: '单条补剂打卡' })
  createLog(@Body() dto: CreateSupplementLogDto, @CurrentUser() user: RequestUser) {
    return this.supplementsService.createLog(user.userId, dto);
  }

  @Get('logs')
  @ApiOperation({ summary: '当日补剂记录（?date=YYYY-MM-DD）' })
  listLogs(@Query() dto: ListSupplementLogsDto, @CurrentUser() user: RequestUser) {
    return this.supplementsService.listLogs(user.userId, dto);
  }
}
