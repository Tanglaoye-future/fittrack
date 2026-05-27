import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { MacroCalculatorService } from '@/common/services/macro-calculator.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RecipesController],
  providers: [RecipesService, MacroCalculatorService],
  exports: [RecipesService],
})
export class RecipesModule {}
