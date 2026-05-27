import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK_LATS = 'BACK_LATS',
  BACK_TRAPS = 'BACK_TRAPS',
  SHOULDERS_FRONT = 'SHOULDERS_FRONT',
  SHOULDERS_SIDE = 'SHOULDERS_SIDE',
  SHOULDERS_REAR = 'SHOULDERS_REAR',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  FOREARMS = 'FOREARMS',
  CORE_ABS = 'CORE_ABS',
  CORE_OBLIQUES = 'CORE_OBLIQUES',
  GLUTES = 'GLUTES',
  QUADS = 'QUADS',
  HAMSTRINGS = 'HAMSTRINGS',
  CALVES = 'CALVES',
  NECK = 'NECK',
}

export enum Equipment {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  MACHINE = 'MACHINE',
  CABLE = 'CABLE',
  BODYWEIGHT = 'BODYWEIGHT',
  KETTLEBELL = 'KETTLEBELL',
  BAND = 'BAND',
  OTHER = 'OTHER',
}

export enum MovementPattern {
  PUSH = 'PUSH',
  PULL = 'PULL',
  SQUAT = 'SQUAT',
  HINGE = 'HINGE',
  CARRY = 'CARRY',
  ROTATION = 'ROTATION',
  ISOLATION = 'ISOLATION',
}

export class SearchExercisesDto {
  @ApiPropertyOptional({ description: '搜索关键词（中文/英文名）' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: MuscleGroup })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscle?: MuscleGroup;

  @ApiPropertyOptional({ enum: Equipment })
  @IsOptional()
  @IsEnum(Equipment)
  equipment?: Equipment;

  @ApiPropertyOptional({ enum: MovementPattern })
  @IsOptional()
  @IsEnum(MovementPattern)
  pattern?: MovementPattern;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateExerciseDto {
  @ApiProperty({ example: '杠铃卧推' })
  @IsString()
  name_zh: string;

  @ApiProperty({ example: 'Barbell Bench Press' })
  @IsString()
  name_en: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup)
  primary_muscle: MuscleGroup;

  @ApiPropertyOptional({ enum: MuscleGroup, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MuscleGroup, { each: true })
  secondary_muscles?: MuscleGroup[];

  @ApiProperty({ enum: Equipment })
  @IsEnum(Equipment)
  equipment: Equipment;

  @ApiProperty({ enum: MovementPattern })
  @IsEnum(MovementPattern)
  movement_pattern: MovementPattern;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  video_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;
}

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}

export class PopularExercisesDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class ExerciseResponseDto {
  id: string;
  name_zh: string;
  name_en: string;
  description: string | null;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  movement_pattern: string;
  video_url: string | null;
  thumbnail_url: string | null;
  is_official: boolean;
  created_by: string | null;
  created_at: Date;

  @IsOptional()
  @IsBoolean()
  is_favorite?: boolean;

  @IsOptional()
  @IsInt()
  use_count?: number;
}
