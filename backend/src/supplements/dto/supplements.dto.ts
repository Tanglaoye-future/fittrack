import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSupplementItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dose?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_controlled?: boolean;
}

export class CreateSupplementScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '"07:00" or "PRE_WORKOUT"' })
  @IsString()
  @IsNotEmpty()
  time_slot: string;

  @ApiPropertyOptional({ type: [CreateSupplementItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplementItemDto)
  items?: CreateSupplementItemDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateSupplementScheduleDto extends PartialType(CreateSupplementScheduleDto) {}

export class CreateSupplementLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schedule_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  dose?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsString()
  taken_at: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_controlled?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class ListSupplementLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}
