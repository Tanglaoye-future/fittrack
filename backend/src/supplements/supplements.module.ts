import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { SupplementsController } from './supplements.controller';
import { SupplementsService } from './supplements.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplementsController],
  providers: [SupplementsService],
  exports: [SupplementsService],
})
export class SupplementsModule {}
