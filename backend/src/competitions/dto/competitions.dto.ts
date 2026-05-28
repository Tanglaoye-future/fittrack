import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum PrepPhaseEnum {
  OFFSEASON = 'OFFSEASON',
  PREP = 'PREP',
  PEAK_WEEK = 'PEAK_WEEK',
  STAGE_DAY = 'STAGE_DAY',
  REBOUND = 'REBOUND',
}

export class CreateCompetitionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  federation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty()
  @IsDateString()
  stage_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  target_weight_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {}

export class CreatePrepCycleDto {
  @ApiProperty()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  start_weight_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  start_body_fat_pct?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class CreatePhaseConfigDto {
  @ApiProperty({ enum: PrepPhaseEnum })
  @IsEnum(PrepPhaseEnum)
  phase: PrepPhaseEnum;

  @ApiProperty()
  @IsInt()
  @Min(1)
  week_start: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  week_end: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  kcal: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  protein_g: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  carbs_g: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  fat_g: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cardio_sessions_per_week?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cardio_minutes_per_session?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardio_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  daily_steps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdatePhaseConfigDto extends PartialType(CreatePhaseConfigDto) {}
