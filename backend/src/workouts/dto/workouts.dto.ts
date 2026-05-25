import { IsString, IsEnum, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWorkoutDto {
  @ApiProperty({ description: '训练类型', enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'] })
  @IsEnum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'])
  workout_type: string;

  @ApiProperty({ description: '训练项目名称', example: '卧推' })
  @IsString()
  exercise_name: string;

  @ApiProperty({ description: '时长（分钟）', example: 60, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration_minutes?: number;

  @ApiProperty({ description: '消耗热量（千卡）', example: 250, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  calories_burned?: number;

  @ApiProperty({ description: '强度', enum: ['LOW', 'MEDIUM', 'HIGH'], required: false })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  intensity?: string;

  @ApiProperty({ description: '组数', example: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sets?: number;

  @ApiProperty({ description: '每组次数', example: 8, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  reps?: number;

  @ApiProperty({ description: '重量（kg）', example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '训练日期', example: '2026-05-25' })
  @IsString()
  workout_date: string;

  @ApiProperty({ description: '训练时间', example: '18:00', required: false })
  @IsOptional()
  @IsString()
  workout_time?: string;
}

export class UpdateWorkoutDto {
  @ApiProperty({ description: '训练类型', enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'])
  workout_type?: string;

  @ApiProperty({ description: '训练项目名称', required: false })
  @IsOptional()
  @IsString()
  exercise_name?: string;

  @ApiProperty({ description: '时长（分钟）', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration_minutes?: number;

  @ApiProperty({ description: '消耗热量（千卡）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  calories_burned?: number;

  @ApiProperty({ description: '强度', enum: ['LOW', 'MEDIUM', 'HIGH'], required: false })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  intensity?: string;

  @ApiProperty({ description: '组数', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sets?: number;

  @ApiProperty({ description: '每组次数', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  reps?: number;

  @ApiProperty({ description: '重量（kg）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '训练日期', required: false })
  @IsOptional()
  @IsString()
  workout_date?: string;

  @ApiProperty({ description: '训练时间', required: false })
  @IsOptional()
  @IsString()
  workout_time?: string;
}

export class QueryWorkoutDto {
  @ApiProperty({ description: '日期', example: '2026-05-25', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: '训练类型', enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'SPORTS', 'OTHER'])
  workout_type?: string;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量', default: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
