import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: '用户名', example: 'john_doe', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '性别', enum: ['MALE', 'FEMALE', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({ description: '年龄', example: 28, required: false })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiProperty({ description: '身高（cm）', example: 180, required: false })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  height?: number;

  @ApiProperty({ description: '健身目标', enum: ['GAIN_MUSCLE', 'LOSE_FAT', 'MAINTENANCE'], required: false })
  @IsOptional()
  @IsEnum(['GAIN_MUSCLE', 'LOSE_FAT', 'MAINTENANCE'])
  fitness_goal?: string;
}

export class UserStatsQueryDto {
  @ApiProperty({ description: '开始日期', example: '2026-05-01', required: false })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ description: '结束日期', example: '2026-05-25', required: false })
  @IsOptional()
  @IsString()
  end_date?: string;
}
