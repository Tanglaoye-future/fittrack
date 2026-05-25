import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBodyRecordDto {
  @ApiProperty({ description: '体重（kg）', example: 72.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @ApiProperty({ description: '体脂率（%）', example: 18.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  body_fat_percentage?: number;

  @ApiProperty({ description: '肌肉量（kg）', example: 55.2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  muscle_mass?: number;

  @ApiProperty({ description: '胸围（cm）', example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  chest?: number;

  @ApiProperty({ description: '腰围（cm）', example: 85, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  waist?: number;

  @ApiProperty({ description: '臀围（cm）', example: 95, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hip?: number;

  @ApiProperty({ description: '臂围（cm）', example: 35, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  arm?: number;

  @ApiProperty({ description: '腿围（cm）', example: 58, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  thigh?: number;

  @ApiProperty({ description: '测量日期', example: '2026-05-25' })
  @IsString()
  measurement_date: string;
}

export class QueryBodyRecordDto {
  @ApiProperty({ description: '开始日期', example: '2026-05-01', required: false })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ description: '结束日期', example: '2026-05-25', required: false })
  @IsOptional()
  @IsString()
  end_date?: string;

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
