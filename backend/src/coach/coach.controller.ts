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
import {
  CoachService,
  InviteAthleteDto,
  UpdateScopesDto,
  CoachCommentDto,
} from './coach.service';

@ApiTags('Coach')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '教练看板（所有学员状态一览）' })
  getDashboard(@CurrentUser() user: RequestUser) {
    return this.coachService.getDashboard(user.userId);
  }

  @Get('athletes')
  @ApiOperation({ summary: '我的学员列表' })
  listAthletes(@CurrentUser() user: RequestUser) {
    return this.coachService.listAthletes(user.userId);
  }

  @Get('athletes/:id')
  @ApiOperation({ summary: '学员详情' })
  @ApiParam({ name: 'id' })
  getAthlete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.coachService.getAthlete(user.userId, id);
  }

  @Post('comments')
  @ApiOperation({ summary: '教练评注（多态：session / meal / photo / check-in）' })
  addComment(@Body() dto: CoachCommentDto, @CurrentUser() user: RequestUser) {
    return this.coachService.addComment(user.userId, dto);
  }
}

// Coach links controller
import { Controller as Ctrl } from '@nestjs/common';

@ApiTags('Coach')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Ctrl('coach-links')
export class CoachLinksController {
  constructor(private readonly coachService: CoachService) {}

  @Post('invite')
  @ApiOperation({ summary: '发送邀请码（教练→学员）' })
  createInvite(@Body() dto: InviteAthleteDto, @CurrentUser() user: RequestUser) {
    return this.coachService.createInvite(user.userId, dto);
  }

  @Post(':code/accept')
  @ApiOperation({ summary: '学员接受邀请（用邀请码）' })
  @ApiParam({ name: 'code' })
  acceptInvite(@Param('code') code: string, @CurrentUser() user: RequestUser) {
    return this.coachService.acceptInvite(code, user.userId);
  }

  @Patch(':id/scopes')
  @ApiOperation({ summary: '更新学员权限范围' })
  @ApiParam({ name: 'id' })
  updateScopes(
    @Param('id') id: string,
    @Body() dto: UpdateScopesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.coachService.updateScopes(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '结束教练关系' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.OK)
  endLink(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.coachService.endLink(id, user.userId);
  }
}
