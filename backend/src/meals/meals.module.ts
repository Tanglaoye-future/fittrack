import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { MacroCalculatorService } from '@/common/services/macro-calculator.service';
import { MealsController } from './meals.controller';
import { NutritionController } from './nutrition.controller';
import { MealsService } from './meals.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MealsController, NutritionController],
  providers: [MealsService, MacroCalculatorService],
  exports: [MealsService],
})
export class MealsModule {}
