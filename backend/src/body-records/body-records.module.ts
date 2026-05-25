import { Module } from '@nestjs/common';
import { BodyRecordsService } from './body-records.service';
import { BodyRecordsController } from './body-records.controller';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BodyRecordsController],
  providers: [BodyRecordsService],
})
export class BodyRecordsModule {}
