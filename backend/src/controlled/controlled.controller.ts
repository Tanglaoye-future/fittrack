import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import {
  ControlledService,
  CreateControlledCycleDto,
  CreateDoseLogDto,
  CreateBloodworkDto,
} from './controlled.service';

@ApiTags('Controlled')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('controlled')
export class ControlledController {
  constructor(private readonly controlledService: ControlledService) {}

  @Get('cycles')
  @ApiOperation({ summary: '我的受控物质周期' })
  listCycles(@CurrentUser() user: RequestUser) {
    return this.controlledService.listCycles(user.userId);
  }

  @Post('cycles')
  @ApiOperation({ summary: '新建周期' })
  createCycle(@Body() dto: CreateControlledCycleDto, @CurrentUser() user: RequestUser) {
    return this.controlledService.createCycle(user.userId, dto);
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: '周期详情（含剂量 + 血检）' })
  @ApiParam({ name: 'id' })
  getCycle(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.controlledService.getCycle(id, user.userId);
  }

  @Post('cycles/:id/doses')
  @ApiOperation({ summary: '记录注射 / 口服剂量' })
  @ApiParam({ name: 'id' })
  logDose(@Body() dto: CreateDoseLogDto, @CurrentUser() user: RequestUser) {
    return this.controlledService.logDose(user.userId, dto);
  }

  @Get('cycles/:id/bloodwork')
  @ApiOperation({ summary: '血检列表' })
  @ApiParam({ name: 'id' })
  listBloodwork(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.controlledService.listBloodwork(id, user.userId);
  }

  @Post('cycles/:id/bloodwork')
  @ApiOperation({ summary: '录入血检结果' })
  @ApiParam({ name: 'id' })
  addBloodwork(
    @Param('id') id: string,
    @Body() dto: CreateBloodworkDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.controlledService.addBloodwork(id, user.userId, dto);
  }
}
