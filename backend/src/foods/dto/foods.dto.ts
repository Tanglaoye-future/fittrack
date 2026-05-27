import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum FoodCategoryEnum {
  MEAT_PROTEIN = 'MEAT_PROTEIN',
  SEAFOOD = 'SEAFOOD',
  DAIRY = 'DAIRY',
  EGGS = 'EGGS',
  GRAIN = 'GRAIN',
  VEGETABLE = 'VEGETABLE',
  FRUIT = 'FRUIT',
  NUTS_SEEDS = 'NUTS_SEEDS',
  OIL_FAT = 'OIL_FAT',
  SAUCE_CONDIMENT = 'SAUCE_CONDIMENT',
  BEVERAGE = 'BEVERAGE',
  PROTEIN_POWDER = 'PROTEIN_POWDER',
  MEAL_REPLACEMENT = 'MEAL_REPLACEMENT',
  PROCESSED_FOOD = 'PROCESSED_FOOD',
  FAST_FOOD = 'FAST_FOOD',
  RESTAURANT = 'RESTAURANT',
  OTHER = 'OTHER',
}

export class SearchFoodsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: FoodCategoryEnum })
  @IsOptional()
  @IsEnum(FoodCategoryEnum)
  category?: FoodCategoryEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class CreateFoodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name_zh: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  kcal_per_100g: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  protein_per_100g: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  carbs_per_100g: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  fat_per_100g: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber_per_100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sugar_per_100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sodium_mg_per_100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  potassium_mg_per_100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_serving_g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serving_name?: string;

  @ApiProperty({ enum: FoodCategoryEnum })
  @IsEnum(FoodCategoryEnum)
  category: FoodCategoryEnum;
}

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}

export class ScanBarcodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  barcode: string;
}
