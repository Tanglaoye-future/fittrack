import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ description: '消费类别', enum: ['FOOD', 'GYM', 'SUPPLEMENTS', 'EQUIPMENT', 'APPAREL', 'OTHER'] })
  @IsEnum(['FOOD', 'GYM', 'SUPPLEMENTS', 'EQUIPMENT', 'APPAREL', 'OTHER'])
  category: string;

  @ApiProperty({ description: '金额', example: 199 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: '货币', example: 'CNY', default: 'CNY', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: '描述', example: '月会费', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '消费日期', example: '2026-05-25' })
  @IsString()
  expense_date: string;
}

export class QueryExpenseDto {
  @ApiProperty({ description: '消费类别', enum: ['FOOD', 'GYM', 'SUPPLEMENTS', 'EQUIPMENT', 'APPAREL', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['FOOD', 'GYM', 'SUPPLEMENTS', 'EQUIPMENT', 'APPAREL', 'OTHER'])
  category?: string;

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
