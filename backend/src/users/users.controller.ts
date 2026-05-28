import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '@/common/decorators/current-user.decorator';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsNumber() age?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() fitness_goal?: string;
}

@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: '用户统计数据（总饮食/训练/消费/体测记录数）' })
  getStats(@CurrentUser() user: RequestUser) {
    return this.usersService.getStats(user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新个人资料（username/gender/age/height）' })
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: RequestUser) {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
