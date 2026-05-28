import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { MealsService } from './meals.service';
import {
  GetElectrolyteLogsDto,
  GetWaterLogsDto,
  LogElectrolyteDto,
  LogWaterDto,
} from './dto/meals.dto';

@ApiTags('Nutrition')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly mealsService: MealsService) {}

  @Post('water')
  @ApiOperation({ summary: '记录饮水量' })
  logWater(@Body() dto: LogWaterDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.logWater(user.userId, dto);
  }

  @Get('water')
  @ApiOperation({ summary: '今日 / 指定日饮水记录' })
  getWaterLogs(@Query() dto: GetWaterLogsDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.getWaterLogs(user.userId, dto);
  }

  @Post('electrolytes')
  @ApiOperation({ summary: '记录电解质摄入' })
  logElectrolyte(@Body() dto: LogElectrolyteDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.logElectrolyte(user.userId, dto);
  }

  @Get('electrolytes')
  @ApiOperation({ summary: '今日 / 指定日电解质记录' })
  getElectrolyteLogs(@Query() dto: GetElectrolyteLogsDto, @CurrentUser() user: RequestUser) {
    return this.mealsService.getElectrolyteLogs(user.userId, dto);
  }
}
