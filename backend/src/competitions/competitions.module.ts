import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CompetitionsController, PrepCyclesController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CompetitionsController, PrepCyclesController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
