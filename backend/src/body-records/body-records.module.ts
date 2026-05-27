import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { BodyRecordsController } from './body-records.controller';
import { BodyRecordsService } from './body-records.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BodyRecordsController],
  providers: [BodyRecordsService],
  exports: [BodyRecordsService],
})
export class BodyRecordsModule {}
