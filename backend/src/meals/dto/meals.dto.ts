import {
  IsArray,
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

export enum MealSlotEnum {
  PRE_WORKOUT = 'PRE_WORKOUT',
  INTRA_WORKOUT = 'INTRA_WORKOUT',
  POST_WORKOUT = 'POST_WORKOUT',
  BREAKFAST = 'BREAKFAST',
  MORNING_SNACK = 'MORNING_SNACK',
  LUNCH = 'LUNCH',
  AFTERNOON_SNACK = 'AFTERNOON_SNACK',
  PRE_DINNER = 'PRE_DINNER',
  DINNER = 'DINNER',
  LATE_NIGHT = 'LATE_NIGHT',
}

export class CreateMealItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  food_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipe_id?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  grams: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class ListMealsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class CreateMealLogDto {
  @ApiProperty({ enum: MealSlotEnum })
  @IsEnum(MealSlotEnum)
  meal_slot: MealSlotEnum;

  @ApiProperty()
  @IsString()
  consumed_at: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateMealItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealItemDto)
  items?: CreateMealItemDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateMealLogDto {
  @ApiPropertyOptional({ enum: MealSlotEnum })
  @IsOptional()
  @IsEnum(MealSlotEnum)
  meal_slot?: MealSlotEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consumed_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddMealItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  food_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipe_id?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  grams: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateMealItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  grams: number;
}

export class QuickLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  scheduled_meal_id: string;

  @ApiProperty()
  @IsString()
  consumed_at: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;
}

// ── Plan Templates ─────────────────────────────────────────────────────────

export class CreateScheduledMealIngredientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  food_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  grams: number;
}

export class CreateScheduledMealDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  order_index: number;

  @ApiProperty({ enum: MealSlotEnum })
  @IsEnum(MealSlotEnum)
  meal_slot: MealSlotEnum;

  @ApiProperty()
  @IsString()
  target_time: string;

  @ApiProperty()
  @IsInt()
  target_kcal: number;

  @ApiProperty()
  @IsInt()
  target_protein_g: number;

  @ApiProperty()
  @IsInt()
  target_carbs_g: number;

  @ApiProperty()
  @IsInt()
  target_fat_g: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipe_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateScheduledMealIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduledMealIngredientDto)
  ingredients?: CreateScheduledMealIngredientDto[];
}

export class CreateMealPlanTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prep_cycle_id?: string;

  @ApiProperty()
  @IsInt()
  total_kcal: number;

  @ApiProperty()
  @IsInt()
  total_protein_g: number;

  @ApiProperty()
  @IsInt()
  total_carbs_g: number;

  @ApiProperty()
  @IsInt()
  total_fat_g: number;

  @ApiPropertyOptional({ type: [CreateScheduledMealDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScheduledMealDto)
  scheduled_meals?: CreateScheduledMealDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateMealPlanTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total_kcal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total_protein_g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total_carbs_g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total_fat_g?: number;
}

// ── Water / Electrolytes ───────────────────────────────────────────────────

export class LogWaterDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  ml: number;

  @ApiProperty()
  @IsString()
  consumed_at: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class GetWaterLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class LogElectrolyteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sodium_mg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  potassium_mg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  magnesium_mg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty()
  @IsString()
  consumed_at: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class GetElectrolyteLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}
