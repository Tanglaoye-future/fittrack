import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SetType {
  WARMUP = 'WARMUP',
  WORKING = 'WORKING',
  DROP = 'DROP',
  RESTPAUSE = 'RESTPAUSE',
  MYOREP = 'MYOREP',
  CLUSTER = 'CLUSTER',
  AMRAP = 'AMRAP',
}

// ── Session ───────────────────────────────────────────────────────────────────

export class StartSessionDto {
  @ApiPropertyOptional({ description: '训练模板 UUID（无则自由训练）' })
  @IsOptional()
  @IsUUID()
  template_id?: string;

  @ApiProperty({ description: '训练日期 YYYY-MM-DD', example: '2026-05-27' })
  @IsDateString()
  session_date: string;

  @ApiPropertyOptional({ description: '当日体重（kg）', example: 82.4 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  bodyweight_kg?: number;

  @ApiProperty({ description: '客户端幂等键 UUID' })
  @IsUUID()
  client_op_id: string;

  @ApiProperty({ description: '客户端写入时刻 ISO 8601' })
  @IsDateString()
  client_ts: string;
}

export class FinishSessionDto {
  @ApiPropertyOptional({ description: '主观 RPE 1-10', example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  overall_rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSessionDto extends PartialType(FinishSessionDto) {}

export class ListSessionsDto {
  @ApiPropertyOptional({ description: '按单日过滤 YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: '按训练计划 UUID 过滤' })
  @IsOptional()
  @IsUUID()
  plan_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ── SessionExercise ───────────────────────────────────────────────────────────

export class AddSessionExerciseDto {
  @ApiProperty({ description: '动作 UUID' })
  @IsUUID()
  exercise_id: string;

  @ApiPropertyOptional({ description: '关联模板动作 UUID' })
  @IsOptional()
  @IsUUID()
  template_exercise_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: '客户端幂等键' })
  @IsUUID()
  client_op_id: string;

  @ApiProperty({ description: '客户端时刻 ISO 8601' })
  @IsDateString()
  client_ts: string;
}

export class UpdateSessionExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order_index?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── SetEntry ──────────────────────────────────────────────────────────────────

export class CreateSetEntryDto {
  @ApiProperty({ description: '组序号（1-indexed）', example: 3 })
  @IsInt()
  @Min(1)
  set_index: number;

  @ApiProperty({ enum: SetType, example: SetType.WORKING })
  @IsEnum(SetType)
  set_type: SetType;

  @ApiPropertyOptional({ description: '重量 kg', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_kg?: number;

  @ApiPropertyOptional({ description: '次数', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number;

  @ApiPropertyOptional({ description: '持续时间（秒），有氧/平板用' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_seconds?: number;

  @ApiPropertyOptional({ description: '距离（米），有氧用' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance_m?: number;

  @ApiPropertyOptional({ description: 'RIR（留力度）', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rir?: number;

  @ApiPropertyOptional({ description: 'RPE（主观强度）', example: 8.5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional({ description: '节奏，格式 "3-1-1-0"' })
  @IsOptional()
  @IsString()
  @Matches(/^\d-\d-\d-\d$/, { message: 'tempo 格式必须为 "N-N-N-N"' })
  tempo?: string;

  @ApiPropertyOptional({ description: '与上组实际间隔秒数' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rest_seconds?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_failure?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_warmup?: boolean;

  @ApiProperty({ description: '客户端幂等键' })
  @IsUUID()
  client_op_id: string;

  @ApiProperty({ description: '客户端写入时刻 ISO 8601' })
  @IsDateString()
  client_ts: string;
}

export class UpdateSetEntryDto extends PartialType(CreateSetEntryDto) {}

// ── Batch Upload ──────────────────────────────────────────────────────────────

export class BatchSetOperationDto {
  @ApiProperty({ description: '幂等键' })
  @IsUUID()
  client_op_id: string;

  @ApiProperty({ description: '所属 session_exercise UUID' })
  @IsUUID()
  session_exercise_id: string;

  @ApiProperty({ type: CreateSetEntryDto })
  @ValidateNested()
  @Type(() => CreateSetEntryDto)
  data: CreateSetEntryDto;
}

export class BatchSetsDto {
  @ApiProperty({ type: [BatchSetOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSetOperationDto)
  operations: BatchSetOperationDto[];
}
