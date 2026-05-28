import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { BodyRecordsController, PhotosController } from './body-records.controller';
import { BodyRecordsService } from './body-records.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BodyRecordsController, PhotosController],
  providers: [BodyRecordsService],
  exports: [BodyRecordsService],
})
export class BodyRecordsModule {}
