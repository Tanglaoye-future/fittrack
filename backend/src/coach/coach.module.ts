import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CoachController, CoachLinksController } from './coach.controller';
import { CoachService } from './coach.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CoachController, CoachLinksController],
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}
