import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum PhotoAngleEnum {
  FRONT = 'FRONT',
  BACK = 'BACK',
  SIDE_LEFT = 'SIDE_LEFT',
  SIDE_RIGHT = 'SIDE_RIGHT',
}

export enum PhotoPoseEnum {
  RELAXED = 'RELAXED',
  FRONT_DOUBLE_BICEPS = 'FRONT_DOUBLE_BICEPS',
  BACK_DOUBLE_BICEPS = 'BACK_DOUBLE_BICEPS',
  SIDE_CHEST = 'SIDE_CHEST',
  SIDE_TRICEPS = 'SIDE_TRICEPS',
  MOST_MUSCULAR = 'MOST_MUSCULAR',
  ABS_AND_THIGHS = 'ABS_AND_THIGHS',
  QUARTER_TURN_LEFT = 'QUARTER_TURN_LEFT',
  QUARTER_TURN_RIGHT = 'QUARTER_TURN_RIGHT',
  OTHER = 'OTHER',
}

export enum VisibilityEnum {
  SELF_ONLY = 'SELF_ONLY',
  COACH_VISIBLE = 'COACH_VISIBLE',
  PUBLIC_OPT_IN = 'PUBLIC_OPT_IN',
}

export class CreateBodyRecordDto {
  @ApiProperty()
  @IsDateString()
  measurement_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  morning_weight_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  evening_weight_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  body_fat_percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  muscle_mass_kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  visceral_fat_index?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  chest_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  waist_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hip_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  arm_left_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  arm_right_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  thigh_left_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  thigh_right_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  calf_left_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  calf_right_cm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  subjective_condition?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  water_retention_score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sleep_hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energy_score?: number;

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

export class UpdateBodyRecordDto extends PartialType(CreateBodyRecordDto) {}

export class ListBodyRecordsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;
}

export class CreateProgressPhotoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body_record_id?: string;

  @ApiProperty()
  @IsDateString()
  photo_date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiProperty({ enum: PhotoAngleEnum })
  @IsEnum(PhotoAngleEnum)
  angle: PhotoAngleEnum;

  @ApiProperty({ enum: PhotoPoseEnum })
  @IsEnum(PhotoPoseEnum)
  pose: PhotoPoseEnum;

  @ApiPropertyOptional({ enum: VisibilityEnum })
  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: VisibilityEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class TrendQueryDto {
  @ApiPropertyOptional({ default: 'weight' })
  @IsOptional()
  @IsString()
  metric?: string;

  @ApiPropertyOptional({ default: '30d' })
  @IsOptional()
  @IsString()
  period?: string;
}
