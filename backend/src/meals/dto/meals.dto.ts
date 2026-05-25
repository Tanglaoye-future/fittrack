import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMealDto {
  @ApiProperty({ description: '餐食类型', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] })
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  meal_type: string;

  @ApiProperty({ description: '食物名称', example: '鸡胸肉' })
  @IsString()
  food_name: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '热量（千卡）', example: 200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  calories?: number;

  @ApiProperty({ description: '蛋白质（克）', example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  protein?: number;

  @ApiProperty({ description: '碳水（克）', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  carbs?: number;

  @ApiProperty({ description: '脂肪（克）', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fat?: number;

  @ApiProperty({ description: '份量', example: '200g', required: false })
  @IsOptional()
  @IsString()
  portion_size?: string;

  @ApiProperty({ description: '饮食日期', example: '2026-05-25' })
  @IsString()
  meal_date: string;

  @ApiProperty({ description: '饮食时间', example: '08:00', required: false })
  @IsOptional()
  @IsString()
  meal_time?: string;
}

export class UpdateMealDto {
  @ApiProperty({ description: '餐食类型', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], required: false })
  @IsOptional()
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  meal_type?: string;

  @ApiProperty({ description: '食物名称', required: false })
  @IsOptional()
  @IsString()
  food_name?: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '热量（千卡）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  calories?: number;

  @ApiProperty({ description: '蛋白质（克）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  protein?: number;

  @ApiProperty({ description: '碳水（克）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  carbs?: number;

  @ApiProperty({ description: '脂肪（克）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fat?: number;

  @ApiProperty({ description: '份量', required: false })
  @IsOptional()
  @IsString()
  portion_size?: string;

  @ApiProperty({ description: '饮食日期', required: false })
  @IsOptional()
  @IsString()
  meal_date?: string;

  @ApiProperty({ description: '饮食时间', required: false })
  @IsOptional()
  @IsString()
  meal_time?: string;
}

export class QueryMealDto {
  @ApiProperty({ description: '日期', example: '2026-05-25', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: '餐食类型', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], required: false })
  @IsOptional()
  @IsEnum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  meal_type?: string;

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
