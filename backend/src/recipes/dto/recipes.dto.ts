import {
  IsArray,
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

export class CreateRecipeIngredientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  food_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  grams: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order_index: number;
}

export class CreateRecipeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  serving_count?: number;

  @ApiPropertyOptional({ type: [CreateRecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients?: CreateRecipeIngredientDto[];
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class CloneRecipeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
