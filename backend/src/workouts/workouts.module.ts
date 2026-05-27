import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { PrService } from './pr.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, PrService],
  exports: [WorkoutsService, PrService],
})
export class WorkoutsModule {}
