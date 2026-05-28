import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum ExpenseCategoryEnum {
  FOOD_GROCERY = 'FOOD_GROCERY',
  DINING_OUT = 'DINING_OUT',
  SUPPLEMENT = 'SUPPLEMENT',
  COACH_FEE = 'COACH_FEE',
  GYM_MEMBERSHIP = 'GYM_MEMBERSHIP',
  EQUIPMENT = 'EQUIPMENT',
  APPAREL_POSING = 'APPAREL_POSING',
  COMPETITION_FEE = 'COMPETITION_FEE',
  TRAVEL_COMPETITION = 'TRAVEL_COMPETITION',
  RECOVERY = 'RECOVERY',
  OTHER = 'OTHER',
}

export enum RecurringCycleEnum {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseCategoryEnum })
  @IsEnum(ExpenseCategoryEnum)
  category: ExpenseCategoryEnum;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ default: 'CNY' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  expense_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receipt_photo_url?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

export class ListExpensesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ enum: ExpenseCategoryEnum })
  @IsOptional()
  @IsEnum(ExpenseCategoryEnum)
  category?: ExpenseCategoryEnum;
}

export class CreateRecurringExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ExpenseCategoryEnum })
  @IsEnum(ExpenseCategoryEnum)
  category: ExpenseCategoryEnum;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: RecurringCycleEnum })
  @IsEnum(RecurringCycleEnum)
  cycle: RecurringCycleEnum;

  @ApiProperty()
  @IsDateString()
  next_run_date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}

export class SetBudgetDto {
  @ApiProperty()
  @IsInt()
  year: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  month: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total_budget: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_op_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_ts: string;
}
