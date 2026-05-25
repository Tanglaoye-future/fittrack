import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserStatsQueryDto } from './dto/users.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取用户个人信息', description: '获取当前登录用户的完整资料' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新用户信息', description: '更新当前用户的个人资料' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取用户统计数据', description: '获取指定时间范围内的使用统计' })
  async getStats(@Request() req, @Query() query: UserStatsQueryDto) {
    return this.usersService.getUserStats(req.user.userId, query.start_date, query.end_date);
  }
}
