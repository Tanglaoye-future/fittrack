import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Template Exercise (嵌套) ──────────────────────────────────────────────────

export class CreateTemplateExerciseDto {
  @ApiProperty({ description: '动作 UUID' })
  @IsUUID()
  exercise_id: string;

  @ApiProperty({ description: '目标组数', example: 4 })
  @IsInt()
  @Min(1)
  target_sets: number;

  @ApiPropertyOptional({ description: '目标最小次数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  target_reps_min?: number;

  @ApiPropertyOptional({ description: '目标最大次数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  target_reps_max?: number;

  @ApiPropertyOptional({ description: '目标 RIR（留力度）', example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  target_rir?: number;

  @ApiPropertyOptional({ description: '目标 RPE', example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  target_rpe?: number;

  @ApiPropertyOptional({ description: '本动作组间休息秒数（覆盖模板默认）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rest_seconds?: number;

  @ApiPropertyOptional({ description: '节奏，格式 "3-1-1-0"' })
  @IsOptional()
  @IsString()
  tempo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Training Template (嵌套) ──────────────────────────────────────────────────

export class CreateTrainingTemplateDto {
  @ApiProperty({ description: '模板名称', example: 'Day A - 胸+三头' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '固定星期几 (0=周日, 1=周一…)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional({ description: '预计训练时长（分钟）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_minutes?: number;

  @ApiPropertyOptional({ description: '默认组间休息秒数', default: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rest_seconds_default?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateTemplateExerciseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateExerciseDto)
  exercises?: CreateTemplateExerciseDto[];
}

export class UpdateTrainingTemplateDto extends PartialType(CreateTrainingTemplateDto) {}

// ── Training Plan ─────────────────────────────────────────────────────────────

export class CreateTrainingPlanDto {
  @ApiProperty({ description: '计划名称', example: 'Prep W1-8 推拉腿' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '周期长度（周数）', example: 8 })
  @IsInt()
  @Min(1)
  @Max(52)
  weeks: number;

  @ApiPropertyOptional({ description: '开始日期 ISO 8601' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: '结束日期 ISO 8601' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ type: [CreateTrainingTemplateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTrainingTemplateDto)
  templates?: CreateTrainingTemplateDto[];
}

export class UpdateTrainingPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CloneTrainingPlanDto {
  @ApiPropertyOptional({ description: '新计划名称（不填则自动加 "（副本）"）' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class CloneFromOfficialPlanDto {
  @ApiProperty({ description: '客户端幂等键（UUID），同 key 重放返回已创建计划' })
  @IsUUID()
  client_op_id: string;

  @ApiPropertyOptional({ description: '自定义计划名（不填则用官方名）' })
  @IsOptional()
  @IsString()
  name?: string;
}
